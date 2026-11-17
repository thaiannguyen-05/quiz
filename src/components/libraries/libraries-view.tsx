"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Layers,
  ListChecks,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useT } from "@/components/i18n-provider";

import {
  createLibrary,
  deleteLibrary,
  renameLibrary,
} from "@/actions/libraries";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { NameDialog } from "@/components/ui/name-dialog";
import {
  addLibraryToCache,
  removeLibraryFromCache,
  renameLibraryInCache,
} from "@/lib/query/cache";
import { librariesQueryOptions } from "@/lib/query/options";
import type { LibrarySummary } from "@/lib/query/types";

const COVERS: Array<
  | { kind: "theme" }
  | { kind: "fixed"; className: string }
> = [
  { kind: "theme" },
  { kind: "fixed", className: "from-[#0f9f7f] via-[#1ab894] to-[#8ce6cf]" },
  { kind: "fixed", className: "from-[#e08a00] via-[#f2ad2f] to-[#ffd98a]" },
  { kind: "fixed", className: "from-[#db3a72] via-[#ef5c92] to-[#ffa7c4]" },
  { kind: "fixed", className: "from-[#0284c7] via-[#38aeea] to-[#9adcff]" },
];

function plural(count: number, word: string) {
  if (count === 1) return `${count} ${word}`;
  const pluralWord = word.endsWith("y")
    ? `${word.slice(0, -1)}ies`
    : `${word}s`;
  return `${count} ${pluralWord}`;
}

export function LibrariesView({
  initialLibraries,
  firstName,
}: {
  initialLibraries: LibrarySummary[];
  firstName: string;
}) {
  const router = useRouter();
  const t = useT();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<LibrarySummary | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<LibrarySummary | null>(
    null,
  );

  const { data: libraries } = useQuery({
    ...librariesQueryOptions(),
    initialData: initialLibraries,
  });

  const createMutation = useMutation({
    mutationFn: createLibrary,
    onSuccess: (result, variables) => {
      if (!result.ok) return;
      addLibraryToCache(queryClient, {
        id: result.id,
        name: variables.name,
      });
      toast.success(t("libraries.toasts.created"));
      router.push(`/libraries/${result.id}`);
    },
  });

  const renameMutation = useMutation({
    mutationFn: renameLibrary,
    onSuccess: (result, variables) => {
      if (!result.ok) return;
      renameLibraryInCache(queryClient, variables.id, variables.name);
      toast.success(t("libraries.toasts.renamed"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLibrary,
    onSuccess: (result, variables) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      removeLibraryFromCache(queryClient, variables.id);
      toast.success(t("libraries.toasts.deleted"));
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error(t("libraries.toasts.deleteFailed"));
    },
  });

  const subjectCount = libraries.reduce(
    (total, library) => total + library.subjectCount,
    0,
  );
  const questionCount = libraries.reduce(
    (total, library) => total + library.questionCount,
    0,
  );

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">
            {t("libraries.pageTitle")}
          </p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
            {t("libraries.greeting", { name: firstName })}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            {t("libraries.intro")}
          </p>
        </div>
        <Button size="lg" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4.5" />
          {t("libraries.newLibrary")}
        </Button>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {[
          {
            label: t("libraries.stats.libraries"),
            value: libraries.length,
            icon: Layers,
            tone: "bg-brand-soft text-brand",
          },
          {
            label: t("libraries.stats.subjects"),
            value: subjectCount,
            icon: BookOpen,
            tone: "bg-mint-soft text-mint",
          },
          {
            label: t("libraries.stats.questions"),
            value: questionCount,
            icon: ListChecks,
            tone: "bg-sun-soft text-[#a66f00]",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[0_10px_30px_-24px_rgba(29,26,51,0.35)]"
          >
            <span
              className={`grid size-10 place-items-center rounded-xl ${stat.tone}`}
            >
              <stat.icon className="size-4.5" />
            </span>
            <div>
              <p className="text-xl font-extrabold leading-none tracking-tight">
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-9 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight">
          {t("libraries.allLibraries")}
        </h2>
        <span className="text-xs font-semibold text-ink-faint">
          {plural(libraries.length, "library")}
        </span>
      </div>

      {libraries.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Sparkles}
          title={t("libraries.emptyTitle")}
          description={t("libraries.emptyDescription")}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4.5" />
              {t("libraries.createLibrary")}
            </Button>
          }
        />
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {libraries.map((library, index) => (
            <article
              key={library.id}
              className="group overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-[0_16px_45px_-30px_rgba(29,26,51,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-30px_rgba(29,26,51,0.5)]"
            >
              <Link
                href={`/libraries/${library.id}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
              >
                {(() => {
                  const cover = COVERS[index % COVERS.length];
                  const isFixed = cover.kind === "fixed";
                  return (
                    <div
                      className={`relative h-24 overflow-hidden ${
                        isFixed ? `bg-gradient-to-br ${cover.className}` : ""
                      }`}
                      style={
                        !isFixed
                          ? {
                              background:
                                "linear-gradient(135deg, var(--color-brand) 0%, color-mix(in srgb, var(--color-brand) 45%, white) 100%)",
                            }
                          : undefined
                      }
                    >
                  <div className="absolute -right-5 -top-7 size-24 rounded-full bg-white/15" />
                  <div className="absolute -bottom-10 right-12 size-20 rounded-full bg-white/10" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                    {plural(library.subjectCount, "subject")}
                  </span>
                  <Layers className="absolute bottom-3 right-4 size-8 text-white/80" />
                </div>
                  );
                })()}
                <div className="p-5 pb-4">
                  <h3 className="truncate text-lg font-extrabold tracking-tight">
                    {library.name}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-ink-faint">
                    {t("libraries.card.created", { date: library.createdLabel })}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-ink-soft">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="size-3.5" />
                      {plural(library.subjectCount, "subject")}
                    </span>
                    <span className="size-1 rounded-full bg-line-strong" />
                    <span className="inline-flex items-center gap-1.5">
                      <ListChecks className="size-3.5" />
                      {plural(library.questionCount, "question")}
                    </span>
                  </div>
                </div>
              </Link>
              <div className="flex items-center justify-between border-t border-line/80 px-3 py-2.5">
                <Link
                  href={`/libraries/${library.id}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-strong transition hover:bg-brand-soft"
                >
                  {t("libraries.card.openLibrary")}
                  <ArrowRight className="size-3.5" />
                </Link>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Rename ${library.name}`}
                    title={t("libraries.renameDialog.title")}
                    onClick={() => setRenameTarget(library)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="dangerGhost"
                    size="icon"
                    aria-label={`Delete ${library.name}`}
                    title="Delete library"
                    onClick={() => setDeleteTarget(library)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <NameDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("libraries.createDialog.title")}
        description={t("libraries.createDialog.description")}
        label={t("libraries.createDialog.label")}
        placeholder={t("libraries.createDialog.placeholder")}
        submitLabel={t("libraries.createDialog.submit")}
        onSubmit={(name) => createMutation.mutateAsync({ name })}
      />

      <NameDialog
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title={t("libraries.renameDialog.title")}
        label={t("libraries.renameDialog.label")}
        initialValue={renameTarget?.name ?? ""}
        submitLabel={t("libraries.renameDialog.submit")}
        onSubmit={async (name) => {
          if (!renameTarget) {
            return { ok: false as const, error: "Library not found." };
          }
          return renameMutation.mutateAsync({ id: renameTarget.id, name });
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t("libraries.deleteDialog.title")}
        description={
          deleteTarget
            ? t("libraries.deleteDialog.description", {
                name: deleteTarget.name,
                subjects: plural(deleteTarget.subjectCount, "subject"),
                questions: plural(deleteTarget.questionCount, "question"),
              })
            : ""
        }
        confirmLabel={t("libraries.deleteDialog.confirm")}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync({ id: deleteTarget.id });
          } catch {
            toast.error(t("libraries.toasts.deleteFailed"));
          }
        }}
      />
    </div>
  );
}
