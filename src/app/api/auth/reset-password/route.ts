import { NextResponse } from "next/server";
import { hashPassword, hashResetToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`reset:${ip}`, 6, 60_000)) {
    return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const resetToken = await db.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken || resetToken.consumedAt || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Reset-Token ist ungültig." }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
      },
    });

    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { consumedAt: new Date() },
    });
  });

  return NextResponse.json({ ok: true });
}
