"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Clock3,
  ListChecks,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { deleteSubject, renameSubject } from "@/actions/subjects";
import { deleteQuestion } from "@/actions/questions";
import {
  QuestionEditorDialog,
  type QuestionItem,
} from "@/components/questions/question-editor-dialog";
import { QuestionList } from "@/components/questions/question-list";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NameDialog } from "@/components/ui/name-dialog";
import { formatMinutes } from "@/lib/utils";

export function SubjectView({
  library,
  subject,
  questions,
}: {
  library: { id: string; name: string };
  subject: {
    id: string;
    name: string;
    createdLabel: string;
  };
  questions: QuestionItem[];
}) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(
    null,
  );
  const [deleteQuestionTarget, setDeleteQuestionTarget] =
    useState<QuestionItem | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteSubjectOpen, setDeleteSubjectOpen] = useState(false);

  const totalSeconds = questions.reduce(
    (total, question) => total + question.timeLimit,
    0,
  );

  function openAddQuestion() {
    setEditingQuestion(null);
    setEditorOpen(true);
  }

  function openEditQuestion(question: QuestionItem) {
    setEditingQuestion(question);
    setEditorOpen(true);
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-faint">
        <Link
          href="/libraries"
          className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Libraries
        </Link>
        <span>/</span>
        <Link
          href={`/libraries/${library.id}`}
          className="max-w-[28vw] truncate rounded-lg px-1 py-0.5 transition hover:text-ink"
        >
          {library.name}
        </Link>
        <span>/</span>
        <span className="max-w-[32vw] truncate text-ink-soft">
          {subject.name}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              {subject.name}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRenameOpen(true)}
              aria-label="Rename subject"
              title="Rename subject"
            >
              <Pencil className="size-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-sm text-ink-soft">
            Created {subject.createdLabel} · {questions.length}{" "}
            {questions.length === 1 ? "question" : "questions"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              <ListChecks className="size-3" />
              {questions.length}{" "}
              {questions.length === 1 ? "question" : "questions"}
            </Badge>
            <Badge tone="sun">
              <Clock3 className="size-3" />
              {formatMinutes(totalSeconds)} total
            </Badge>
            {questions.some(
              (question) =>
                question.answers.filter((answer) => answer.isCorrect).length >
                1,
            ) ? (
              <Badge tone="mint">Includes multi-answer</Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={openAddQuestion}>
            <Plus className="size-4" />
            Add question
          </Button>
          {questions.length > 0 ? (
            <Link
              href={`/play/${library.id}/${subject.id}`}
              className={buttonClasses({ size: "md" })}
            >
              <Play className="size-4 fill-current" />
              Play
            </Link>
          ) : (
            <span
              className={buttonClasses({
                size: "md",
                className: "pointer-events-none opacity-50",
              })}
            >
              <Play className="size-4 fill-current" />
              Play
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight">Questions</h2>
        <Button
          variant="dangerGhost"
          size="sm"
          onClick={() => setDeleteSubjectOpen(true)}
        >
          <Trash2 className="size-3.5" />
          Delete subject
        </Button>
      </div>

      <div className="mt-4">
        <QuestionList
          subjectId={subject.id}
          questions={questions}
          onAdd={openAddQuestion}
          onEdit={openEditQuestion}
          onDelete={(question) => setDeleteQuestionTarget(question)}
        />
      </div>

      <QuestionEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        subjectId={subject.id}
        question={editingQuestion}
      />

      <NameDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename subject"
        label="Subject name"
        initialValue={subject.name}
        submitLabel="Save changes"
        onSubmit={async (name) => {
          const result = await renameSubject({ id: subject.id, name });
          if (result.ok) {
            toast.success("Subject renamed");
            router.refresh();
          }
          return result;
        }}
      />

      <ConfirmDialog
        open={deleteQuestionTarget !== null}
        onClose={() => setDeleteQuestionTarget(null)}
        title="Delete this question?"
        description={
          deleteQuestionTarget
            ? `“${deleteQuestionTarget.text.slice(0, 120)}${
                deleteQuestionTarget.text.length > 120 ? "…" : ""
              }” will be permanently deleted.`
            : ""
        }
        confirmLabel="Delete question"
        onConfirm={async () => {
          if (!deleteQuestionTarget) return;
          const result = await deleteQuestion({
            questionId: deleteQuestionTarget.id,
          });
          if (result.ok) {
            toast.success("Question deleted");
            setDeleteQuestionTarget(null);
            router.refresh();
          } else {
            toast.error(result.error);
          }
        }}
      />

      <ConfirmDialog
        open={deleteSubjectOpen}
        onClose={() => setDeleteSubjectOpen(false)}
        title="Delete this subject?"
        description={`“${subject.name}” and its ${questions.length} question${
          questions.length === 1 ? "" : "s"
        } will be permanently deleted.`}
        confirmLabel="Delete subject"
        onConfirm={async () => {
          const result = await deleteSubject({ id: subject.id });
          if (result.ok) {
            toast.success("Subject deleted");
            router.push(`/libraries/${library.id}`);
            router.refresh();
          } else {
            toast.error(result.error);
          }
        }}
      />
    </div>
  );
}
