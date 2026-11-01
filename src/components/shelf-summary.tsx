"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { STATUS_COLORS } from "@/lib/book-status";
import type { BookStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

export function ShelfSummary({
  total,
  countByStatus,
}: {
  total: number;
  countByStatus: Record<string, number | undefined>;
}) {
  const { t } = useI18n();

  return (
    <Link
      href="/shelf"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div>
        <p className="text-sm text-muted-foreground">{t.home.totalBooks}</p>
        <p className="text-3xl font-semibold">{total}</p>
      </div>
      <div className="ml-auto flex flex-wrap gap-2">
        {(["WANT_TO_READ", "READING", "READ"] as BookStatus[]).map((status) => (
          <Badge
            key={status}
            variant="outline"
            className={cn("border-transparent", STATUS_COLORS[status])}
          >
            {t.status[status]} {countByStatus[status] ?? 0}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
