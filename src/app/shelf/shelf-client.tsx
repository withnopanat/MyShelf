"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/empty-state";
import { BookDetailModal } from "@/components/book-detail-modal";
import { ManualBookForm } from "@/components/manual-book-form";
import { deleteShelfItem, updateShelfItem, type ShelfItem } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { apiErrorMessage } from "@/lib/api-error";
import { BOOK_STATUSES, STATUS_COLORS } from "@/lib/book-status";
import type { BookStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type Counts = Record<string, number | undefined>;

const BookshelfScene = dynamic(
  () => import("@/components/three/bookshelf-scene").then((m) => m.BookshelfScene),
  { ssr: false, loading: () => <div className="h-[520px] w-full animate-pulse rounded-xl bg-muted" /> },
);

export function ShelfClient({
  items,
  countByStatus,
  total,
  activeStatus,
}: {
  items: ShelfItem[];
  countByStatus: Counts;
  total: number;
  activeStatus?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toRemove, setToRemove] = useState<ShelfItem | null>(null);
  const [detail, setDetail] = useState<ShelfItem | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const navigateWithStatus = (status?: string) => {
    startTransition(() => router.push(status ? `/shelf?status=${status}` : "/shelf"));
  };

  const changeStatus = async (item: ShelfItem, status: BookStatus) => {
    try {
      await updateShelfItem(item.id, { status });
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(apiErrorMessage(error, t.errors));
    }
  };

  const remove = async () => {
    if (!toRemove) return;
    try {
      await deleteShelfItem(toRemove.id);
      toast.success(t.shelf.remove);
      setToRemove(null);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(apiErrorMessage(error, t.errors));
      setToRemove(null);
    }
  };

  const visible = filter.trim()
    ? items.filter((item) => {
        const needle = filter.trim().toLowerCase();
        return (
          item.book.title.toLowerCase().includes(needle) ||
          item.book.authors.some((a) => a.toLowerCase().includes(needle)) ||
          item.tags.some((tag) => tag.toLowerCase().includes(needle))
        );
      })
    : items;

  const tabs = [{ key: "", label: t.shelf.all, count: total }].concat(
    BOOK_STATUSES.map((s) => ({ key: s, label: t.status[s], count: countByStatus[s] ?? 0 })),
  );
  const activeTab = activeStatus ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold">{t.shelf.title}</h1>
        <div className="flex gap-2 sm:ml-auto sm:w-64">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t.shelf.searchInShelf}
          />
          <Button size="icon" variant="outline" aria-label={t.home.addManual} onClick={() => setManualOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => navigateWithStatus(tab.key || undefined)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:opacity-80",
            )}
          >
            {tab.label} <span className="opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {visible.length === 0 ? (
          <EmptyState
            title={t.shelf.empty}
            description={
              <Link href="/search" className="text-primary underline-offset-2 hover:underline">
                {t.shelf.emptyHint}
              </Link>
            }
          />
        ) : (
                  <BookshelfScene
          books={visible.map((item) => ({
            itemId: item.id,
            title: item.book.title,
            authors: item.book.authors,
            coverUrl: item.book.coverUrl,
            backCoverUrl: item.book.backCoverUrl,
            pageCount: item.book.pageCount,
            status: item.status,
          }))}
          onSelect={(itemId) => {
            const item = visible.find((v) => v.id === itemId);
            if (item) setDetail(item);
          }}
        />
      </div>

      <BookDetailModal
        item={detail}
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        onItemChanged={() => startTransition(() => router.refresh())}
        onRemove={(item) => {
          setDetail(null);
          setToRemove(item);
        }}
      />

      <ManualBookForm
        open={manualOpen}
        onOpenChange={setManualOpen}
        onCreated={() => startTransition(() => router.refresh())}
      />
    </div>
  );
}
