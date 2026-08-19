"use client";

import { useId, useRef } from "react";
import type { BrandConfig } from "@/brands/types";
import { ArrowUpIcon } from "@/components/ui/icons";
import { MAX_QUESTION_LENGTH } from "@/lib/ask-ava";

function resizeTextarea(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
}

export function ConversationComposer({
  brand,
  disabled,
  onSend,
}: {
  brand: BrandConfig;
  disabled?: boolean;
  onSend: (value: string) => boolean;
}) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="border-t border-line bg-page pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) return;

        const formData = new FormData(event.currentTarget);
        const value = String(formData.get("message") ?? "");
        const sent = onSend(value);
        if (!sent) return;

        event.currentTarget.reset();
        const textarea = event.currentTarget.querySelector("textarea");
        if (textarea) {
          textarea.style.height = "auto";
          textarea.focus();
        }
      }}
    >
      <div className="site-shell py-3">
        <label htmlFor={id} className="sr-only">
          {brand.conversation.composerLabel}
        </label>
        <div className="flex items-end gap-2 rounded-[28px] border border-line bg-card p-1.5 focus-within:border-brand">
          <textarea
            id={id}
            name="message"
            rows={1}
            maxLength={MAX_QUESTION_LENGTH}
            disabled={disabled}
            enterKeyHint="send"
            placeholder={brand.askAva.placeholder}
            className="max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-4 py-2.5 text-[0.98rem] leading-6 text-heading outline-none placeholder:text-muted disabled:opacity-60"
            onInput={(event) => resizeTextarea(event.currentTarget)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey) return;
              event.preventDefault();
              formRef.current?.requestSubmit();
            }}
          />
          <button
            type="submit"
            disabled={disabled}
            aria-label={brand.conversation.sendLabel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-on-primary transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowUpIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </form>
  );
}
