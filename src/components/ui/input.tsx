import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const inputClasses =
  "h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-sm text-ink shadow-[inset_0_1px_1px_rgba(29,26,51,0.02)] transition placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:bg-[#f3f1f9] disabled:text-ink-faint";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        inputClasses,
        "h-auto min-h-24 resize-y py-3 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
