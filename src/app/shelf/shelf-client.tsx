"use client";

import { useState, useTransition } from "react";
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
import { Book3D } from "@/components/book-3d";
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((item) => (
              <div
                key={item.id}
                className="flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md group"
                onClick={() => setDetail(item)}
              >
                {item.book.pageCount ? (
                  <Book3D
                    title={item.book.title}
                    coverUrl={item.book.coverUrl}
                    pages={item.book.pageCount}
                    size="sm"
                    className="shrink-0"
                  />
                ) : (
                  <BookCover
                    title={item.book.title}
                    coverUrl={item.book.coverUrl}
                    className="h-28 w-20 shrink-0 rounded-md shadow-sm"
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.book.title}</p>
                  {item.book.authors.length > 0 && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {item.book.authors.join(", ")}
                    </p>
                  )}
                  <Badge className={cn("mt-1 w-fit border-transparent", STATUS_COLORS[item.status])}>
                    {t.status[item.status]}
                  </Badge>
                  {item.tags.length > 0 && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/70">
                      {item.tags.map((tag) => `#${tag}`).join(" ")}
                    </p>
                  )}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={t.shelf.changeStatus}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {BOOK_STATUSES.filter((s) => s !== item.status).map((s) => (
                      <DropdownMenuItem key={s} onClick={() => changeStatus(item, s)}>
                        {t.shelf.changeStatus}: {t.status[s]}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setToRemove(item)}
                    >
                      {t.shelf.remove}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={toRemove !== null} onOpenChange={(open) => !open && setToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.shelf.removeConfirmTitle}</DialogTitle>
            <DialogDescription>
              {t.shelf.removeConfirmBody.replace("{title}", toRemove?.book.title ?? "")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToRemove(null)}>
              {t.shelf.cancel}
            </Button>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              {t.shelf.confirmRemove}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
