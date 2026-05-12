import { UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`login:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingaben." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json({ error: "Login fehlgeschlagen." }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Login fehlgeschlagen." }, { status: 401 });
  }

  if (user.status === UserStatus.PENDING) {
    return NextResponse.json(
      { error: "Dein Konto ist noch nicht freigegeben. Bitte warte auf die Admin-Freigabe." },
      { status: 403 },
    );
  }
  if (user.status === UserStatus.BLOCKED) {
    return NextResponse.json({ error: "Dein Konto ist gesperrt." }, { status: 403 });
  }

  await createSession(user.id);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}
