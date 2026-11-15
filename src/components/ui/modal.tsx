"use client";

import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-6xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizeClasses;
  dismissible?: boolean;
}) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, dismissible]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        "input:not([type='hidden']), textarea, select, button:not([data-close])",
      );
      focusable?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div className="relative flex min-h-full items-start justify-center p-4 sm:items-center sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            "animate-pop-in relative my-auto w-full rounded-3xl border border-white/70 bg-white p-5 shadow-[0_24px_80px_-24px_rgba(29,26,51,0.45)] sm:p-6",
            sizeClasses[size],
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl font-extrabold tracking-tight">
                {title}
              </h2>
              {description ? (
                <p
                  id={descriptionId}
                  className="mt-1.5 text-sm leading-relaxed text-ink-soft"
                >
                  {description}
                </p>
              ) : null}
            </div>
            {dismissible ? (
              <button
                type="button"
                data-close
                onClick={onClose}
                className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-xl text-ink-faint transition hover:bg-[#f3f1f9] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                aria-label="Close dialog"
              >
                <X className="size-4.5" />
              </button>
            ) : null}
          </div>

          <div className="mt-5">{children}</div>

          {footer ? (
            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
