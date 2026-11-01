import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BOOK_STATUSES } from "@/lib/book-status";
import { ScanPanel } from "@/components/scan-panel";
import { ShelfSummary } from "@/components/shelf-summary";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  const userId = session.user.id;

  const counts = await prisma.shelfItem.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });
  const countByStatus = Object.fromEntries(
    BOOK_STATUSES.map((s) => [s, counts.find((c) => c.status === s)?._count._all ?? 0]),
  );
  const total = Object.values(countByStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <ShelfSummary total={total} countByStatus={countByStatus} />
      <ScanPanel />
    </div>
  );
}
