"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock3,
  FileUp,
  Layers,
  ListChecks,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { deleteLibrary, renameLibrary } from "@/actions/libraries";
import {
  createSubject,
  deleteSubject,
  renameSubject,
} from "@/actions/subjects";
import { ImportDialog } from "@/components/import/import-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { NameDialog } from "@/components/ui/name-dialog";
import { formatMinutes } from "@/lib/utils";

export type SubjectSummary = {
  id: string;
  name: string;
  questionCount: number;
  totalSeconds: number;
  updatedLabel: string;
};

export type LibraryOption = { id: string; name: string };

export function LibraryView({
  library,
  subjects,
  libraries,
}: {
  library: { id: string; name: string; createdLabel: string };
  subjects: SubjectSummary[];
  libraries: LibraryOption[];
}) {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [renameLibraryOpen, setRenameLibraryOpen] = useState(false);
  const [deleteLibraryOpen, setDeleteLibraryOpen] = useState(false);
  const [renameSubjectTarget, setRenameSubjectTarget] =
    useState<SubjectSummary | null>(null);
  const [deleteSubjectTarget, setDeleteSubjectTarget] =
    useState<SubjectSummary | null>(null);

  const questionCount = subjects.reduce(
    (total, subject) => total + subject.questionCount,
    0,
  );
  const totalSeconds = subjects.reduce(
    (total, subject) => total + subject.totalSeconds,
    0,
  );

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-faint">
        <Link
          href="/libraries"
          className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Libraries
        </Link>
        <span>/</span>
        <span className="max-w-[40vw] truncate text-ink-soft">
          {library.name}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              {library.name}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRenameLibraryOpen(true)}
              aria-label="Rename library"
              title="Rename library"
            >
              <Pencil className="size-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-sm text-ink-soft">
            Created {library.createdLabel} · {subjects.length}{" "}
            {subjects.length === 1 ? "subject" : "subjects"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              <BookOpen className="size-3" />
              {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
            </Badge>
            <Badge tone="mint">
              <ListChecks className="size-3" />
              {questionCount} {questionCount === 1 ? "question" : "questions"}
            </Badge>
            <Badge tone="sun">
              <Clock3 className="size-3" />
              {formatMinutes(totalSeconds)} of practice
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setCreateSubjectOpen(true)}>
            <Plus className="size-4" />
            New subject
          </Button>
          <Button onClick={() => setImportOpen(true)}>
            <FileUp className="size-4" />
            Import CSV
          </Button>
        </div>
      </div>

      <div className="mt-9 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight">Subjects</h2>
        <Button
          variant="dangerGhost"
          size="sm"
          onClick={() => setDeleteLibraryOpen(true)}
        >
          <Trash2 className="size-3.5" />
          Delete library
        </Button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Sparkles}
          title="No subjects in this library yet"
          description="Import a CSV to create a subject with its questions, or start an empty subject and add questions by hand."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" onClick={() => setCreateSubjectOpen(true)}>
                <Plus className="size-4" />
                Empty subject
              </Button>
              <Button onClick={() => setImportOpen(true)}>
                <FileUp className="size-4" />
                Import a CSV
              </Button>
            </div>
          }
        />
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject, index) => (
            <article
              key={subject.id}
              className="group overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-[0_16px_45px_-32px_rgba(29,26,51,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-30px_rgba(29,26,51,0.45)]"
            >
              <Link
                href={`/libraries/${library.id}/subjects/${subject.id}`}
                className="block p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`grid size-11 place-items-center rounded-2xl ${
                      [
                        "bg-brand-soft text-brand",
                        "bg-mint-soft text-mint",
                        "bg-sun-soft text-[#a66f00]",
                        "bg-coral-soft text-coral",
                      ][index % 4]
                    }`}
                  >
                    <BookOpen className="size-5" />
                  </span>
                  {subject.questionCount === 0 ? (
                    <Badge tone="neutral">Empty</Badge>
                  ) : (
                    <Badge tone="neutral">
                      {subject.questionCount}{" "}
                      {subject.questionCount === 1 ? "question" : "questions"}
                    </Badge>
                  )}
                </div>
                <h3 className="mt-4 line-clamp-2 text-base font-extrabold leading-snug tracking-tight">
                  {subject.name}
                </h3>
                <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-ink-faint">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="size-3" />
                    {formatMinutes(subject.totalSeconds)}
                  </span>
                  <span className="size-1 rounded-full bg-line-strong" />
                  <span>Updated {subject.updatedLabel}</span>
                </div>
              </Link>
              <div className="flex items-center justify-between border-t border-line/80 px-3 py-2.5">
                <Link
                  href={`/libraries/${library.id}/subjects/${subject.id}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-strong transition hover:bg-brand-soft"
                >
                  Open subject
                  <ArrowRight className="size-3.5" />
                </Link>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Rename ${subject.name}`}
                    title="Rename subject"
                    onClick={() => setRenameSubjectTarget(subject)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="dangerGhost"
                    size="icon"
                    aria-label={`Delete ${subject.name}`}
                    title="Delete subject"
                    onClick={() => setDeleteSubjectTarget(subject)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-brand/10 bg-brand-soft/50 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand">
          <Layers className="size-4" />
        </span>
        <div>
          <p className="text-sm font-extrabold">Keep subjects focused</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            A subject is one quiz set — for example one chapter or one practice
            exam. Smaller sets are easier to drill and re-import.
          </p>
        </div>
      </div>

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        libraries={libraries}
        defaultLibraryId={library.id}
      />

      <NameDialog
        open={createSubjectOpen}
        onClose={() => setCreateSubjectOpen(false)}
        title="Create an empty subject"
        description="You can add questions one at a time after creating it."
        label="Subject name"
        placeholder="e.g. Chapter 4 — Joins"
        submitLabel="Create subject"
        onSubmit={async (name) => {
          const result = await createSubject({ libraryId: library.id, name });
          if (result.ok) {
            toast.success("Subject created");
            router.push(`/libraries/${library.id}/subjects/${result.id}`);
          }
          return result;
        }}
      />

      <NameDialog
        open={renameLibraryOpen}
        onClose={() => setRenameLibraryOpen(false)}
        title="Rename library"
        label="Library name"
        initialValue={library.name}
        submitLabel="Save changes"
        onSubmit={async (name) => {
          const result = await renameLibrary({ id: library.id, name });
          if (result.ok) {
            toast.success("Library renamed");
            router.refresh();
          }
          return result;
        }}
      />

      <NameDialog
        open={renameSubjectTarget !== null}
        onClose={() => setRenameSubjectTarget(null)}
        title="Rename subject"
        label="Subject name"
        initialValue={renameSubjectTarget?.name ?? ""}
        submitLabel="Save changes"
        onSubmit={async (name) => {
          if (!renameSubjectTarget) {
            return { ok: false as const, error: "Subject not found." };
          }
          const result = await renameSubject({
            id: renameSubjectTarget.id,
            name,
          });
          if (result.ok) {
            toast.success("Subject renamed");
            router.refresh();
          }
          return result;
        }}
      />

      <ConfirmDialog
        open={deleteSubjectTarget !== null}
        onClose={() => setDeleteSubjectTarget(null)}
        title="Delete this subject?"
        description={
          deleteSubjectTarget
            ? `“${deleteSubjectTarget.name}” and its ${deleteSubjectTarget.questionCount} question${
                deleteSubjectTarget.questionCount === 1 ? "" : "s"
              } will be permanently deleted.`
            : ""
        }
        confirmLabel="Delete subject"
        onConfirm={async () => {
          if (!deleteSubjectTarget) return;
          const result = await deleteSubject({ id: deleteSubjectTarget.id });
          if (result.ok) {
            toast.success("Subject deleted");
            setDeleteSubjectTarget(null);
            router.refresh();
          } else {
            toast.error(result.error);
          }
        }}
      />

      <ConfirmDialog
        open={deleteLibraryOpen}
        onClose={() => setDeleteLibraryOpen(false)}
        title="Delete this library?"
        description={`“${library.name}” and all of its ${subjects.length} subject${
          subjects.length === 1 ? "" : "s"
        } (${questionCount} question${questionCount === 1 ? "" : "s"}) will be permanently deleted.`}
        confirmLabel="Delete library"
        onConfirm={async () => {
          const result = await deleteLibrary({ id: library.id });
          if (result.ok) {
            toast.success("Library deleted");
            router.push("/libraries");
            router.refresh();
          } else {
            toast.error(result.error);
          }
        }}
      />
    </div>
  );
}
