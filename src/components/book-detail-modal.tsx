"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookCover } from "@/components/book-cover";
import { TagEditor } from "@/components/tag-editor";
import { EditionCovers } from "@/components/edition-covers";
import { updateShelfItem, apiPatch, type ShelfItem } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { apiErrorMessage } from "@/lib/api-error";
import { BOOK_STATUSES, STATUS_COLORS } from "@/lib/book-status";
import type { BookStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type Props = {
  item: ShelfItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemChanged?: () => void;
  onRemove?: (item: ShelfItem) => void;
};

export function BookDetailModal({ item, open, onOpenChange, onItemChanged, onRemove }: Props) {
  const { t } = useI18n();
  const [tags, setTags] = useState<string[] | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  if (!item) return null;
  const currentTags = tags ?? item.tags;
  const currentTitle = title ?? item.book.title;
  const isManualOwner = item.book.createdByUserId !== null && item.book.googleBooksId === null;

  const saveStatus = async (status: BookStatus) => {
    try {
      await updateShelfItem(item.id, { status });
      toast.success(t.common.saved);
      onItemChanged?.();
    } catch (error) {
      toast.error(apiErrorMessage(error, t.errors));
    }
  };

  const saveTags = async (next: string[]) => {
    try {
      await updateShelfItem(item.id, { tags: next });
    } catch (error) {
      toast.error(apiErrorMessage(error, t.errors));
    }
  };

  const saveManualTitle = async () => {
    if (!title || !title.trim() || title === item.book.title) return;
    try {
      await apiPatch(`/api/books/${item.book.id}`, { title }, "errors.generic");
      toast.success(t.common.saved);
      onItemChanged?.();
    } catch (error) {
      toast.error(apiErrorMessage(error, t.errors));
    }
  };

  const info: Array<[string, string | undefined]> = [
    [t.detail.publisher, item.book.publisher ?? undefined],
    [t.detail.publishedDate, item.book.publishedDate ?? undefined],
    [t.detail.pageCount, item.book.pageCount ? String(item.book.pageCount) : undefined],
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setTags(null);
          setTitle(null);
        }
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-left">{currentTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 sm:flex-row">
          <BookCover
            title={currentTitle}
            coverUrl={item.book.coverUrl}
            className="h-64 w-44 shrink-0 self-center rounded-lg shadow-md sm:self-start"
          />
          <div className="min-w-0 flex-1 space-y-4">
            {item.book.authors.length > 0 && (
              <p className="text-sm text-muted-foreground">{item.book.authors.join(", ")}</p>
            )}

            {isManualOwner && (
              <div className="flex gap-2">
                <input
                  value={currentTitle}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                  aria-label={t.shelf.manualEdit}
                />
                <Button size="sm" variant="outline" onClick={saveManualTitle}>
                  {t.common.save}
                </Button>
              </div>
            )}

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t.shelf.changeStatus}</p>
              <Select value={item.status} onValueChange={(v) => saveStatus(v as BookStatus)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOOK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <Badge className={cn("border-transparent", STATUS_COLORS[s])}>{t.status[s]}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t.shelf.tags}</p>
              <TagEditor tags={currentTags} onChange={setTags} onCommit={saveTags} />
            </div>

            <dl className="space-y-1 text-sm">
              {info.map(([label, value]) =>
                value ? (
                  <div key={label} className="flex gap-2">
                    <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="min-w-0">{value}</dd>
                  </div>
                ) : null,
              )}
            </dl>

            {item.book.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.book.categories.map((c) => (
                  <Badge key={c} variant="outline">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <EditionCovers title={item.book.title} currentGoogleBooksId={item.book.googleBooksId} />

        <p className="mb-1 text-xs font-medium text-muted-foreground">{t.detail.description}</p>
          <p className="text-sm leading-relaxed">
            {item.book.description ?? t.detail.noDescription}
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="destructive" size="sm" onClick={() => onRemove?.(item)}>
            {t.shelf.remove}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
