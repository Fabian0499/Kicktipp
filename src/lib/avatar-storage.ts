import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

const LOCAL_AVATAR_PREFIX = "/uploads/avatars/";

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isBlobAvatarUrl(avatarUrl: string) {
  return avatarUrl.includes("blob.vercel-storage.com");
}

export async function saveAvatarFile(
  userId: string,
  extension: string,
  fileBuffer: Buffer,
  contentType: string,
): Promise<string> {
  const filename = `${userId}-${randomUUID()}.${extension}`;

  if (useBlobStorage()) {
    const blob = await put(`avatars/${filename}`, fileBuffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadDirectory, { recursive: true });
  const absoluteTargetPath = path.join(uploadDirectory, filename);
  await writeFile(absoluteTargetPath, fileBuffer);
  return `${LOCAL_AVATAR_PREFIX}${filename}`;
}

export async function deleteAvatarFile(avatarUrl: string | null | undefined) {
  if (!avatarUrl) {
    return;
  }

  if (isBlobAvatarUrl(avatarUrl)) {
    if (useBlobStorage()) {
      await del(avatarUrl).catch(() => undefined);
    }
    return;
  }

  if (!avatarUrl.startsWith(LOCAL_AVATAR_PREFIX)) {
    return;
  }

  const oldFilename = avatarUrl.replace(LOCAL_AVATAR_PREFIX, "");
  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "avatars");
  const oldAbsolutePath = path.join(uploadDirectory, oldFilename);
  await unlink(oldAbsolutePath).catch(() => undefined);
}
