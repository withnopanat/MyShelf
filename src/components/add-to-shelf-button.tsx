"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addToShelf } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { BOOK_STATUSES } from "@/lib/book-status";
import type { NormalizedBook } from "@/lib/book-types";
import type { BookStatus } from "@/generated/prisma/client";

export function AddToShelfButton({
  book,
  onAdded,
  compact = false,
}: {
  book: NormalizedBook;
  onAdded?: (status: BookStatus) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);

  const add = async (status: BookStatus) => {
    setPending(true);
    try {
      await addToShelf(book, status);
      toast.success(t.common.added);
      onAdded?.(status);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    } finally {
      setPending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={compact ? "sm" : "default"} disabled={pending}>
          <Plus className="h-4 w-4" /> {t.common.addToShelf}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {BOOK_STATUSES.map((status) => (
          <DropdownMenuItem key={status} onClick={() => add(status)}>
            {t.status[status]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
