import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth, signIn } from "@/auth";
import { dictionaries, getLocale } from "@/lib/i18n";

export default async function SignInPage() {
  await connection();
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (session?.user) redirect("/");
  const t = dictionaries[locale];

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">{t.signin.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.signin.subtitle}</p>
        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            {t.signin.googleButton}
          </button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">{t.signin.note}</p>
      </div>
    </main>
  );
}
