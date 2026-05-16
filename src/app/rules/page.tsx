import { cookies } from "next/headers";
import { RulesContent } from "@/components/rules-content";
import { getMessages, getLocale } from "@/lib/i18n/locale";

export default async function RulesPage() {
  const cookieStore = await cookies();
  const rules = getMessages(getLocale(cookieStore)).rules;

  return (
    <main
      className="relative flex min-h-screen flex-1 items-start bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/kicktipp-bg-2026.png')" }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold text-white">{rules.title}</h1>
        <p className="mt-2 max-w-2xl text-zinc-100">{rules.intro}</p>
        <RulesContent m={rules} />
      </div>
    </main>
  );
}
