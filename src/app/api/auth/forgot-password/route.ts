import { NextResponse } from "next/server";
import { generateResetToken, hashResetToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation";
import { sendMail } from "@/server/mail";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`forgot:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const plainToken = generateResetToken();
  const tokenHash = hashResetToken(plainToken);

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetLink = `${appUrl}/reset-password?token=${plainToken}`;

  await sendMail({
    to: user.email,
    subject: "Passwort zurücksetzen",
    text: `Hallo ${user.name}, nutze diesen Link zum Zurücksetzen deines Passworts: ${resetLink}`,
  });

  return NextResponse.json({ ok: true });
}
