"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function ProfileAvatarUpload({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function uploadFile(file: File | undefined) {
    if (!file) {
      setError("Bitte ein Bild auswählen.");
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Profilbild konnte nicht gespeichert werden.");
      setSaving(false);
      return;
    }

    setMessage("Profilbild wurde aktualisiert.");
    setSaving(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    router.refresh();
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    await uploadFile(file);
  }

  return (
    <article className="rounded-xl border bg-white p-5 text-zinc-900 shadow-sm">
      <h2 className="text-sm font-medium text-zinc-600">Profilbild</h2>
      <div className="mt-3 flex items-center gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`Profilbild von ${name}`}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-zinc-100 text-xs text-zinc-600">
            Kein Bild
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          <button
            type="button"
            onClick={openFilePicker}
            disabled={saving}
            className="w-fit cursor-pointer rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Lädt hoch..." : "Profilbild hochladen"}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-500">Erlaubt: JPG, PNG, WEBP, GIF bis 5 MB.</p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
    </article>
  );
}
