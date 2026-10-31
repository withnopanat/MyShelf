import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  // หน้าแรกจริง (สแกน ISBN + สรุปชั้น) มาใน Task 11 — ขั้นนี้เป็น placeholder
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">สวัสดี {session.user.name ?? "ผู้ใช้"}</h1>
      <p className="mt-2 text-muted-foreground">หน้าสแกน ISBN กำลังจะมาในเร็ว ๆ นี้</p>
    </div>
  );
}
