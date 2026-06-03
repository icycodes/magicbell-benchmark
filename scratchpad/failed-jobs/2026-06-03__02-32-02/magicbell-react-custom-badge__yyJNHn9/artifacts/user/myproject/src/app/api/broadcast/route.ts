import { NextRequest, NextResponse } from "next/server";
import { Client } from "magicbell-js/project-client";

function getUserEmail(): string {
  const baseEmail = process.env.MAGICBELL_EMAIL || "";
  const runId = process.env.ZEALT_RUN_ID || "default";
  const atIndex = baseEmail.lastIndexOf("@");
  if (atIndex === -1) return baseEmail;
  return `${baseEmail.slice(0, atIndex)}+${runId}${baseEmail.slice(atIndex)}`;
}

export async function POST(_req: NextRequest) {
  const projectToken = process.env.MAGICBELL_PROJECT_TOKEN;
  if (!projectToken) {
    return NextResponse.json(
      { error: "Missing MAGICBELL_PROJECT_TOKEN" },
      { status: 500 }
    );
  }

  const userEmail = getUserEmail();

  const client = new Client({ token: projectToken });

  try {
    const result = await client.broadcasts.createBroadcast({
      title: "Hello from MagicBell! 🔔",
      content: "This is a test broadcast notification sent from the demo app.",
      recipients: [{ email: userEmail }],
    });

    return NextResponse.json(
      { success: true, email: userEmail, broadcastId: result.data?.id },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Broadcast error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
