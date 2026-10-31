import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth, signIn } from "@/auth";

export default async function SignInPage() {
  await connection();
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">MyShelf</h1>
        <p className="mt-2 text-sm text-black/60">
          ชั้นวางหนังสือส่วนตัวของคุณ
        </p>
        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-[#5F7A61] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4E6850]"
          >
            ล็อกอินด้วย Google
          </button>
        </form>
        <p className="mt-4 text-xs text-black/40">
          อนุญาตเฉพาะอีเมลที่ได้รับอนุญาตเท่านั้น
        </p>
      </div>
    </main>
  );
}
