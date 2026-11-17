"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useT } from "@/components/i18n-provider";
import { createQuestion, updateQuestion } from "@/actions/questions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { upsertQuestionInCache } from "@/lib/query/cache";
import type { QuestionItem } from "@/lib/query/types";
import { cn } from "@/lib/utils";

export type { QuestionItem } from "@/lib/query/types";

const LETTERS = ["A", "B", "C", "D"];

type AnswerDraft = { text: string; isCorrect: boolean };

type QuestionEditorDialogProps = {
  open: boolean;
  onClose: () => void;
  libraryId: string;
  subjectId: string;
  question: QuestionItem | null;
};

export function QuestionEditorDialog(props: QuestionEditorDialogProps) {
  if (!props.open) return null;
  return <QuestionEditorDialogContent {...props} />;
}

function QuestionEditorDialogContent({
  onClose,
  libraryId,
  subjectId,
  question,
}: QuestionEditorDialogProps) {
  const queryClient = useQueryClient();
  const t = useT();
  const [text, setText] = useState(question?.text ?? "");
  const [answers, setAnswers] = useState<AnswerDraft[]>(() =>
    question
      ? question.answers.map((answer) => ({
          text: answer.text,
          isCorrect: answer.isCorrect,
        }))
      : [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ],
  );
  const [timeLimit, setTimeLimit] = useState(question?.timeLimit ?? 40);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (input: {
      text: string;
      answers: string[];
      correctIndices: number[];
      timeLimit: number;
    }) =>
      question
        ? updateQuestion({ questionId: question.id, ...input })
        : createQuestion({ subjectId, ...input }),
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.error);
        return;
      }

      upsertQuestionInCache(
        queryClient,
        libraryId,
        subjectId,
        result.question,
      );
      toast.success(question ? t("questionEditor.toasts.updated") : t("questionEditor.toasts.added"));
      onClose();
    },
    onError: () => {
      setError("Could not save the question. Please try again.");
    },
  });

  const busy = saveMutation.isPending;

  function updateAnswer(index: number, patch: Partial<AnswerDraft>) {
    setAnswers((previous) =>
      previous.map((answer, answerIndex) =>
        answerIndex === index ? { ...answer, ...patch } : answer,
      ),
    );
  }

  function addAnswer() {
    if (answers.length >= 4) return;
    setAnswers((previous) => [
      ...previous,
      { text: "", isCorrect: false },
    ]);
  }

  function removeAnswer(index: number) {
    if (answers.length <= 2) return;
    setAnswers((previous) =>
      previous.filter((_, answerIndex) => answerIndex !== index),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanText = text.trim();
    const cleanAnswers = answers.map((answer) => answer.text.trim());
    const correctIndices = answers
      .map((answer, index) => (answer.isCorrect ? index : -1))
      .filter((index) => index >= 0);

    if (!cleanText) {
      setError("Question text is required.");
      return;
    }
    if (cleanAnswers.length < 2) {
      setError("Add at least two answers.");
      return;
    }
    if (cleanAnswers.some((answer) => !answer)) {
      setError("Answers cannot be empty.");
      return;
    }
    if (correctIndices.length === 0) {
      setError("Mark at least one correct answer.");
      return;
    }
    if (!Number.isInteger(timeLimit) || timeLimit < 1 || timeLimit > 300) {
      setError("Time limit must be between 1 and 300 seconds.");
      return;
    }

    saveMutation.mutate({
      text: cleanText,
      answers: cleanAnswers,
      correctIndices,
      timeLimit,
    });
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={question ? t("questionEditor.editTitle") : t("questionEditor.addTitle")}
      description={t("questionEditor.description")}
      size="lg"
      dismissible={!busy}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="question-text">Question</Label>
          <Textarea
            id="question-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("questionEditor.promptPlaceholder")}
            rows={3}
            maxLength={2000}
            disabled={busy}
          />
          <p className="text-right text-[11px] text-ink-faint">
            {text.length}/2000
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Answers</Label>
            <span className="text-[11px] font-semibold text-ink-faint">
              Tick every correct answer
            </span>
          </div>

          <div className="space-y-2">
            {answers.map((answer, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border bg-white p-2 transition",
                  answer.isCorrect
                    ? "border-mint/40 bg-mint-soft/30"
                    : "border-line",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-xl text-xs font-extrabold",
                    answer.isCorrect
                      ? "bg-mint text-white"
                      : "bg-[#f3f1f9] text-ink-soft",
                  )}
                >
                  {LETTERS[index]}
                </span>
                <Input
                  value={answer.text}
                  onChange={(event) =>
                    updateAnswer(index, { text: event.target.value })
                  }
                  placeholder={t("questionEditor.answerPlaceholder", { n: index + 1 })}
                  maxLength={500}
                  disabled={busy}
                  aria-label={`Answer ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    updateAnswer(index, { isCorrect: !answer.isCorrect })
                  }
                  disabled={busy}
                  aria-label={
                    answer.isCorrect
                      ? `Mark answer ${index + 1} incorrect`
                      : `Mark answer ${index + 1} correct`
                  }
                  aria-pressed={answer.isCorrect}
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                    answer.isCorrect
                      ? "border-mint/30 bg-mint text-white"
                      : "border-line-strong bg-white text-ink-faint hover:border-mint/40 hover:text-mint",
                  )}
                >
                  <Check className="size-4" strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={() => removeAnswer(index)}
                  disabled={answers.length <= 2 || busy}
                  aria-label={`Remove answer ${index + 1}`}
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-ink-faint transition hover:bg-coral-soft hover:text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          {answers.length < 4 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addAnswer}
              disabled={busy}
            >
              <Plus className="size-4" />
              Add answer
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-[#fbfaff] p-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <Label htmlFor="question-time">Time limit (seconds)</Label>
            <Input
              id="question-time"
              type="number"
              min={1}
              max={300}
              value={Number.isFinite(timeLimit) ? timeLimit : ""}
              onChange={(event) => setTimeLimit(Number(event.target.value))}
              className="w-32"
              disabled={busy}
            />
          </div>
          <p className="pb-2 text-[11px] leading-relaxed text-ink-faint sm:max-w-xs sm:text-right">
            The timer carries across from the CSV. Wrong or timed-out answers
            wait for you; correct answers continue automatically.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-coral/20 bg-coral-soft px-3 py-2 text-xs font-semibold text-[#8b2b3a]"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner /> : <Check className="size-4" />}
            {question ? "Save changes" : "Add question"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
