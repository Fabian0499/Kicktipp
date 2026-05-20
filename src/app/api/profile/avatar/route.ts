import { NextResponse } from "next/server";
import { deleteAvatarFile, saveAvatarFile } from "@/lib/avatar-storage";
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

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const publicAvatarUrl = await saveAvatarFile(
      currentUser.id,
      extension,
      fileBuffer,
      file.type,
    );

    const oldAvatarUrl = currentUser.avatarUrl;
    await db.user.update({
      where: { id: currentUser.id },
      data: { avatarUrl: publicAvatarUrl },
    });

    await deleteAvatarFile(oldAvatarUrl);

    return NextResponse.json({ ok: true, avatarUrl: publicAvatarUrl });
  } catch {
    return NextResponse.json(
      { error: "Profilbild konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
