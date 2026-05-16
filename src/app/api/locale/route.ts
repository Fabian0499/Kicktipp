import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/types";

const bodySchema = z.object({
  locale: z.enum(["de", "en"]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCALE_COOKIE, parsed.data.locale as Locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
