/* eslint-disable @typescript-eslint/no-require-imports */
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const pricing=require('./helpers/spin-pricing.cjs');
const quoteId='11111111-1111-4111-8111-111111111111';
function load(file,imports){
 const testModule={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,{
  module:testModule,exports:testModule.exports,Date,URL,console:{error(){}},process:{env:{STRIPE_SECRET_KEY:'fake'}},
  require:name=>name==='@/lib/spin-pricing'?pricing:name==='node:crypto'?require('node:crypto'):imports[name],
 });return testModule.exports;
}
function checkout({free=false,completed=false,stock=1100,creditError=null,quoteError=null,emailFailure=false}={}){
 const calls=[];
 const q={id:quoteId,spins:free?1:3,package_id:free?'individual':'three-spins',subtotal:free?1800:4500,discount:free?1800:300,amount:free?0:4200,completed};
 class Stripe{paymentIntents={create:async(...args)=>{calls.push(['stripe',...args]);return{client_secret:'fake'};}};}
 const {POST}=load('app/api/create-payment-intent/route.ts',{
  'next/server':{NextResponse:Response},stripe:Stripe,
  '@/lib/server/free-purchase-email':{deliverFreePurchaseEmail:async()=>{calls.push(['email']);if(emailFailure)throw new Error('Email failed');}},
  '@/lib/spin-sales':{remainingSpinsForSale:sold=>1100-sold,SOLD_OUT_MESSAGE:'Sold out'},
  '@/lib/server/supabase':{getRequestUser:async()=>({id:'user',email:'buyer@example.invalid'}),supabaseAdmin:{rpc:async(name,args)=>{
    calls.push([name,args]);
    if(name==='sold_spin_count')return{data:1100-stock,error:null};
    if(name==='create_discount_quote')return{data:quoteError?null:q,error:quoteError};
    if(name==='complete_discount_checkout'){if(!creditError)q.completed=true;return{data:q,error:creditError};}
    throw new Error('Unexpected RPC');
  }}},
 });
 return{calls,q,run:()=>POST(new Request('https://example.invalid/api/create-payment-intent',{method:'POST',body:JSON.stringify({quantity:q.spins,packageId:q.package_id,checkoutRequestId:quoteId,discount:999999,amount:1})}))};
}

test('paid checkout uses the database quote, frozen discount and stable Stripe key',async()=>{
 const d=checkout();const response=await d.run();assert.equal(response.status,200);
 assert.equal((await response.json()).amount,4200);
 const request=d.calls.find(call=>call[0]==='stripe');
 assert.equal(request[1].amount,4200);assert.equal(request[1].metadata.discountCents,'300');
 assert.equal(request[1].metadata.checkoutQuoteId,quoteId);assert.equal(request[2].idempotencyKey,'discount-checkout/'+quoteId);
 assert.equal(pricing.isValidSpinPayment(request[1].metadata,4200),true);
 assert.equal(pricing.isValidSpinPayment({...request[1].metadata,discountCents:'999999'},4200),false);
});

test('the balance endpoint requires authentication and always uses the signed-in account',async()=>{
 const calls=[];
 for(const authenticated of [false,true]){
  const {GET}=load('app/api/discount-balance/route.ts',{
   'next/server':{NextResponse:Response},
   '@/lib/server/supabase':{getRequestUser:async()=>authenticated?{id:'owner'}:null,supabaseAdmin:{rpc:async(name,args)=>{calls.push([name,args]);return{data:{enabled:true,balanceCents:200},error:null};}}},
  });
  const response=await GET(new Request('https://example.invalid/api/discount-balance?user_id=someone-else'));
  assert.equal(response.status,authenticated?200:401);
 }
 assert.equal(calls.length,1);assert.equal(calls[0][1].p_user_id,'owner');
});
test('free purchases complete without Stripe, including retries after the campaign sells out',async()=>{
 for(const completed of [false,true]){
  const d=checkout({free:true,completed,stock:completed?0:1100});
  const response=await d.run();assert.equal(response.status,200);assert.equal((await response.json()).free,true);
  assert.equal(d.calls.filter(call=>call[0]==='stripe').length,0);
  assert.equal(d.calls.find(call=>call[0]==='complete_discount_checkout')[1].p_payment_id,'free_'+quoteId);
  assert.ok(d.calls.some(call=>call[0]==='email'));
 }
});
test('changed balances, unavailable quotes and uncertain free-email delivery never create a charge',async()=>{
 for(const [options,status] of [[{free:true,creditError:{message:'Discount balance changed'}},409],[{quoteError:{code:'timeout'}},500],[{free:true,emailFailure:true},500]]){
  const d=checkout(options);assert.equal((await d.run()).status,status);
  assert.equal(d.calls.filter(call=>call[0]==='stripe').length,0);
 }
});
test('a discount spin is a non-win and sends neither winner nor sponsor mail',async()=>{
 const calls=[];
 const {POST}=load('app/api/spin/route.ts',{
  'next/server':{NextResponse:Response},
  '@/lib/server/supabase':{getRequestUser:async()=>({id:'user',email:'buyer@example.invalid'}),supabaseAdmin:{rpc:async()=>({data:{outcomeId:9,outcomeLabel:'?',remainingSpins:1,won:false,spinAgain:false,prize:null,discountAwardCents:200},error:null})}},
  '@/lib/server/win-email':{sendWinEmail:async()=>calls.push('winner')},
  '@/lib/server/sponsor-notification':{notifyPrizeSponsor:async()=>calls.push('sponsor')},
  '@/lib/server/gift-cards':{giftCardsEnabled:()=>false,deliverGiftCard:async()=>calls.push('gift')},
 });
 const response=await POST(new Request('https://example.invalid/api/spin',{method:'POST',body:JSON.stringify({requestId:quoteId})}));
 const result=await response.json();assert.equal(result.won,false);assert.equal(result.discountAwardCents,200);assert.deepEqual(calls,[]);
});
test('discount settlement verifies its saved quote and refunds an overlapping spent discount',async()=>{
 const payment={id:'pi_test',status:'succeeded',currency:'usd',amount_received:4200,metadata:{userId:'user',spins:'3',pricingVersion:'discounts-v1',packageId:'three-spins',subtotalCents:'4500',discountCents:'300',checkoutQuoteId:quoteId}};
 const calls=[];
 const quote={spins:3,amount:4200,subtotal:4500,discount:300,package_id:'three-spins'};
 const {settlePayment}=load('lib/server/settle-payment.ts',{
  '@/lib/server/supabase':{supabaseAdmin:{rpc:async(name,args)=>{calls.push([name,args]);return name==='get_discount_quote'?{data:quote,error:null}:{error:{code:'P0001',message:'Discount balance changed'}};}}},
 });
 const stripe={refunds:{list:async()=>({data:[]}),create:async args=>{calls.push(['refund',args]);return{status:'succeeded',metadata:args.metadata};}}};
 const result=await settlePayment(stripe,payment);assert.equal(result.status,'refunded');assert.equal(result.reason,'discount_balance_changed');
 assert.equal(calls.find(call=>call[0]==='refund')[1].amount,4200);
 quote.spins=6;
 await assert.rejects(settlePayment(stripe,payment),/Invalid stored discount quote/);
});
