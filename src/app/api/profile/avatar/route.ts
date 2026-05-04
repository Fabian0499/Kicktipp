import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function getExtensionFromMime(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return null;
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Bitte zuerst einloggen." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Bitte eine Bilddatei auswählen." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Nur JPG, PNG, WEBP oder GIF sind erlaubt." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Die Datei darf maximal 5 MB groß sein." }, { status: 400 });
  }

  const extension = getExtensionFromMime(file.type);
  if (!extension) {
    return NextResponse.json({ error: "Nicht unterstütztes Bildformat." }, { status: 400 });
  }

  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadDirectory, { recursive: true });

  const filename = `${currentUser.id}-${randomUUID()}.${extension}`;
  const absoluteTargetPath = path.join(uploadDirectory, filename);
  const publicAvatarUrl = `/uploads/avatars/${filename}`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absoluteTargetPath, fileBuffer);

  const oldAvatarUrl = currentUser.avatarUrl;
  await db.user.update({
    where: { id: currentUser.id },
    data: { avatarUrl: publicAvatarUrl },
  });

  if (oldAvatarUrl?.startsWith("/uploads/avatars/")) {
    const oldFilename = oldAvatarUrl.replace("/uploads/avatars/", "");
    const oldAbsolutePath = path.join(uploadDirectory, oldFilename);
    await unlink(oldAbsolutePath).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, avatarUrl: publicAvatarUrl });
}
