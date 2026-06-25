import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function GET() {
  return Response.json({
    message: "Email route is working",
  });
}



export async function POST(req: Request) {
  const { email, prize } = await req.json();
  

  
const result = await resend.emails.send({
  from: "onboarding@resend.dev",
  to: "shoshanbernstein@gmail.com",
  subject: "🎉 Congratulations! You Won",
  html: `
    <h1>Congratulations!</h1>
    <p>You won:</p>
    <h2>${prize}</h2>
  `,
});

console.log("RESEND RESULT:", result);

  

  
return NextResponse.json({
  success: true,
  result,
});
}