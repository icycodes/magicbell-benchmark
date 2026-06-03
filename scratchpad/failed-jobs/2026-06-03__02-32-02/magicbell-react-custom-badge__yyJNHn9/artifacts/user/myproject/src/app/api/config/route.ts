import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

function getUserEmail(): string {
  const baseEmail = process.env.MAGICBELL_EMAIL || "";
  const runId = process.env.ZEALT_RUN_ID || "default";
  const atIndex = baseEmail.lastIndexOf("@");
  if (atIndex === -1) return baseEmail;
  return `${baseEmail.slice(0, atIndex)}+${runId}${baseEmail.slice(atIndex)}`;
}

export async function GET(req: NextRequest) {
  const secretKey = process.env.MAGICBELL_SECRET_KEY;
  const apiKey = process.env.MAGICBELL_API_KEY;

  if (!secretKey || !apiKey) {
    return NextResponse.json({ error: "Missing MagicBell credentials" }, { status: 500 });
  }

  const userEmail = getUserEmail();

  // Generate a User JWT signed with the project secret key
  const userJwt = jwt.sign(
    {
      sub: userEmail,
      iat: Math.floor(Date.now() / 1000),
    },
    secretKey,
    {
      expiresIn: "7d",
    }
  );

  return NextResponse.json({
    token: userJwt,
    email: userEmail,
    apiKey,
  });
}
