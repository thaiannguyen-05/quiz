"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

import {
  createLibrary,
  deleteLibrary,
  renameLibrary,
} from "@/actions/libraries";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { NameDialog } from "@/components/ui/name-dialog";

export type LibrarySummary = {
  id: string;
  name: string;
  subjectCount: number;
  questionCount: number;
  createdLabel: string;
};

const COVERS = [
  "from-[#6d5cff] via-[#7f6dff] to-[#b2a8ff]",
  "from-[#0f9f7f] via-[#1ab894] to-[#8ce6cf]",
  "from-[#e08a00] via-[#f2ad2f] to-[#ffd98a]",
  "from-[#db3a72] via-[#ef5c92] to-[#ffa7c4]",
  "from-[#0284c7] via-[#38aeea] to-[#9adcff]",
];

function plural(count: number, word: string) {
  if (count === 1) return `${count} ${word}`;
  const pluralWord = word.endsWith("y")
    ? `${word.slice(0, -1)}ies`
    : `${word}s`;
  return `${count} ${pluralWord}`;
}

export function LibrariesView({
  libraries,
  firstName,
}: {
  libraries: LibrarySummary[];
  firstName: string;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<LibrarySummary | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<LibrarySummary | null>(
    null,
  );

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
            Your workspace
          </p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
            Hey {firstName}, ready to learn?
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            Libraries hold your subjects. Drop in a CSV, tidy up the questions,
            then practise until the answers stick.
          </p>
        </div>
        <Button size="lg" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4.5" />
          New library
        </Button>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Libraries",
            value: libraries.length,
            icon: Layers,
            tone: "bg-brand-soft text-brand",
          },
          {
            label: "Subjects",
            value: subjectCount,
            icon: BookOpen,
            tone: "bg-mint-soft text-mint",
          },
          {
            label: "Questions",
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
          All libraries
        </h2>
        <span className="text-xs font-semibold text-ink-faint">
          {plural(libraries.length, "library")}
        </span>
      </div>

      {libraries.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Sparkles}
          title="Your first library starts here"
          description="Create a library for a course or semester, then import a CSV of questions as a subject."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4.5" />
              Create a library
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
                <div
                  className={`relative h-24 overflow-hidden bg-gradient-to-br ${COVERS[index % COVERS.length]}`}
                >
                  <div className="absolute -right-5 -top-7 size-24 rounded-full bg-white/15" />
                  <div className="absolute -bottom-10 right-12 size-20 rounded-full bg-white/10" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                    {plural(library.subjectCount, "subject")}
                  </span>
                  <Layers className="absolute bottom-3 right-4 size-8 text-white/80" />
                </div>
                <div className="p-5 pb-4">
                  <h3 className="truncate text-lg font-extrabold tracking-tight">
                    {library.name}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-ink-faint">
                    Created {library.createdLabel}
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
                  Open library
                  <ArrowRight className="size-3.5" />
                </Link>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Rename ${library.name}`}
                    title="Rename library"
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
        title="Create a library"
        description="Use a course, semester, or exam name. You can add subjects right after."
        label="Library name"
        placeholder="e.g. Data Analysis — Semester 1"
        submitLabel="Create library"
        onSubmit={async (name) => {
          const result = await createLibrary({ name });
          if (result.ok) {
            toast.success("Library created");
            router.push(`/libraries/${result.id}`);
          }
          return result;
        }}
      />

      <NameDialog
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Rename library"
        label="Library name"
        initialValue={renameTarget?.name ?? ""}
        submitLabel="Save changes"
        onSubmit={async (name) => {
          if (!renameTarget) return { ok: false as const, error: "Not found." };
          const result = await renameLibrary({ id: renameTarget.id, name });
          if (result.ok) {
            toast.success("Library renamed");
            router.refresh();
          }
          return result;
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete this library?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” and all of its ${plural(
                deleteTarget.subjectCount,
                "subject",
              )} (${plural(deleteTarget.questionCount, "question")}) will be permanently deleted.`
            : ""
        }
        confirmLabel="Delete library"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const result = await deleteLibrary({ id: deleteTarget.id });
          if (result.ok) {
            toast.success("Library deleted");
            setDeleteTarget(null);
            router.refresh();
          } else {
            toast.error(result.error);
          }
        }}
      />
    </div>
  );
}
