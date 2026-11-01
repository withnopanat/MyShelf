import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dictionaries, getLocale } from "@/lib/i18n";

export default async function Home() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session?.user) redirect("/signin");
  const t = dictionaries[locale];

  // หน้าแรกจริง (สแกน ISBN + สรุปชั้น) มาใน Task 11 — ขั้นนี้เป็น placeholder
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">
        {t.home.greeting.replace("{name}", session.user.name ?? "ผู้ใช้")}
      </h1>
      <p className="mt-2 text-muted-foreground">{t.home.comingSoon}</p>
    </div>
  );
}
