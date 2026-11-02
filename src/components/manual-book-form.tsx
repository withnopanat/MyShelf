"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiPost } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { BOOK_STATUSES } from "@/lib/book-status";
import type { BookStatus } from "@/generated/prisma/client";

export function ManualBookForm({
  open,
  onOpenChange,
  defaultIsbn,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultIsbn?: string;
  onCreated?: () => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [categories, setCategories] = useState("");
  const [isbn13, setIsbn13] = useState(defaultIsbn ?? "");
  const [status, setStatus] = useState<BookStatus>("WANT_TO_READ");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await apiPost(
        "/api/shelf",
        {
          manual: {
            title: title.trim(),
            authors: authors.trim() ? authors.split(",").map((a) => a.trim()).filter(Boolean) : [],
            categories: categories.trim() ? categories.split(",").map((c) => c.trim()).filter(Boolean) : [],
            isbn13: isbn13.trim() || null,
          },
          status,
        },
        "errors.generic",
      );
      toast.success(t.common.added);
      onOpenChange(false);
      setTitle("");
      setAuthors("");
      setCategories("");
      setIsbn13(defaultIsbn ?? "");
      onCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.home.addManual}</DialogTitle>
          <DialogDescription>{t.shelf.emptyHint}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="manual-title">{t.search.typeTitle} *</Label>
            <Input id="manual-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-authors">{t.search.typeAuthor}</Label>
            <Input
              id="manual-authors"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="J. K. Rowling, สุมาลี"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-categories">{t.search.typeCategory}</Label>
            <Input id="manual-categories" value={categories} onChange={(e) => setCategories(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-isbn">ISBN</Label>
            <Input id="manual-isbn" value={isbn13} onChange={(e) => setIsbn13(e.target.value)} inputMode="numeric" />
          </div>
          <div className="space-y-1.5">
            <Label>{t.shelf.changeStatus}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as BookStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t.status[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !title.trim()}>
              {t.common.add}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
