import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BOOK_STATUSES } from "@/lib/book-status";
import { ShelfClient } from "./shelf-client";

const STATUSES = ["WANT_TO_READ", "READING", "READ"] as const;
type Status = (typeof STATUSES)[number];

export default async function ShelfPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; tag?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  const userId = session.user.id;
  const { status, q, tag } = await searchParams;

  const where: Prisma.ShelfItemWhereInput = { userId };
  if (status && STATUSES.includes(status as Status)) where.status = status as Status;
  if (q?.trim()) {
    where.book = {
      OR: [
        { title: { contains: q.trim(), mode: "insensitive" } },
        { authors: { hasSome: [q.trim()] } },
      ],
    };
  }
  if (tag?.trim()) where.tags = { has: tag.trim() };

  const items = await prisma.shelfItem.findMany({
    where,
    include: { book: true },
    orderBy: { updatedAt: "desc" },
  });

  const counts = await prisma.shelfItem.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });
  const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]));
  const total = Object.values(BOOK_STATUSES).reduce((sum, s) => sum + (countByStatus.get(s) ?? 0), 0);

  return (
    <ShelfClient
      items={items.map((item) => ({ ...item, book: { ...item.book } }))}
      countByStatus={Object.fromEntries(countByStatus)}
      total={total}
      activeStatus={status && STATUSES.includes(status as Status) ? status : undefined}
    />
  );
}
