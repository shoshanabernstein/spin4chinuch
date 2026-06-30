import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function GET() {
  return Response.json({
    message: "Email route is working",
  });
}

export async function POST(req: Request) {
  const { email, prize } = await req.json();

  if (!email || !prize) {
    return NextResponse.json(
      { error: "Missing email or prize" },
      { status: 400 }
    );
  }

  const result = await resend.emails.send({
    from: "Spin4Chinuch <onboarding@resend.dev>",
    to: email,
    subject: "Congratulations! You won",
    html: `
      <h1>Congratulations!</h1>
      <p>You won:</p>
      <h2>${prize}</h2>
      <p>Thank you for supporting Jewish education.</p>
    `,
  });

  return NextResponse.json({
    success: true,
    result,
  });
}
