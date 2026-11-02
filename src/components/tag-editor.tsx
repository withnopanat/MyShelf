"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/i18n-provider";

export function TagEditor({
  tags,
  onChange,
  onCommit,
  disabled = false,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  onCommit: (tags: string[]) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value || tags.includes(value)) {
      setDraft("");
      return;
    }
    const next = [...tags, value];
    onChange(next);
    setDraft("");
    onCommit(next);
  };

  const remove = (tag: string) => {
    const next = tags.filter((x) => x !== tag);
    onChange(next);
    onCommit(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          #{tag}
          {!disabled && (
            <button type="button" onClick={() => remove(tag)} aria-label={`remove ${tag}`}>
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      {!disabled && (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={t.detail.addTag}
          className="h-7 w-32 text-xs"
        />
      )}
    </div>
  );
}
