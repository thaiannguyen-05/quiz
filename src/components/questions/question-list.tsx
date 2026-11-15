"use client";

import { useOptimistic, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Clock3,
  GripVertical,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { reorderQuestions } from "@/actions/questions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { QuestionItem } from "@/components/questions/question-editor-dialog";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"];

function SortableQuestionRow({
  question,
  index,
  disabled,
  onEdit,
  onDelete,
}: {
  question: QuestionItem;
  index: number;
  disabled: boolean;
  onEdit: (question: QuestionItem) => void;
  onDelete: (question: QuestionItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled });

  const correctLetters = question.answers
    .map((answer, answerIndex) =>
      answer.isCorrect ? LETTERS[answerIndex] : null,
    )
    .filter(Boolean)
    .join(", ");

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-start gap-3 border-t border-line/80 bg-white px-3 py-4 first:border-t-0 sm:items-center sm:px-4",
        isDragging && "relative z-20 rounded-2xl shadow-lg ring-2 ring-brand/20",
      )}
    >
      <button
        type="button"
        className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-ink-faint transition hover:bg-[#f3f1f9] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:mt-0"
        aria-label={`Reorder question ${index + 1}`}
        {...attributes}
        {...listeners}
        disabled={disabled}
      >
        <GripVertical className="size-4" />
      </button>

      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-xs font-extrabold text-brand-strong">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">
          {question.text}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ink-faint">
          <span className="inline-flex items-center gap-1">
            <ListChecks className="size-3" />
            {question.answers.length} answers
          </span>
          <span className="size-1 rounded-full bg-line-strong" />
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3" />
            {question.timeLimit}s
          </span>
          {correctLetters ? (
            <>
              <span className="size-1 rounded-full bg-line-strong" />
              <Badge tone="mint" className="px-2 py-0.5 text-[10px]">
                Correct: {correctLetters}
              </Badge>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(question)}
          aria-label={`Edit question ${index + 1}`}
          title="Edit question"
          disabled={disabled}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="dangerGhost"
          size="icon"
          onClick={() => onDelete(question)}
          aria-label={`Delete question ${index + 1}`}
          title="Delete question"
          disabled={disabled}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}

export function QuestionList({
  subjectId,
  questions,
  onAdd,
  onEdit,
  onDelete,
}: {
  subjectId: string;
  questions: QuestionItem[];
  onAdd: () => void;
  onEdit: (question: QuestionItem) => void;
  onDelete: (question: QuestionItem) => void;
}) {
  const [items, applyOptimisticOrder] = useOptimistic(
    questions,
    (_current, next: QuestionItem[]) => next,
  );
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || isPending) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const nextItems = arrayMove(items, oldIndex, newIndex);

    startTransition(async () => {
      applyOptimisticOrder(nextItems);

      try {
        const result = await reorderQuestions({
          subjectId,
          questionIds: nextItems.map((item) => item.id),
        });

        if (!result.ok) {
          toast.error(result.error);
        }
      } catch {
        toast.error("Could not save the new order.");
      }
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No questions yet"
        description="Add questions one by one, or import a CSV as a new subject."
        action={
          <Button onClick={onAdd}>
            <Plus className="size-4" />
            Add the first question
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-[0_16px_45px_-34px_rgba(29,26,51,0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-[#fbfaff] px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          <span>
            {items.length} question{items.length === 1 ? "" : "s"}
          </span>
          <span className="size-1 rounded-full bg-line-strong" />
          <span className="text-ink-faint">Drag the handle to reorder</span>
        </div>
        {isPending ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-faint">
            <Spinner className="size-3.5" />
            Saving order…
          </span>
        ) : null}
      </div>

      <DndContext
        id={`question-list-${subjectId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul>
            {items.map((question, index) => (
              <SortableQuestionRow
                key={question.id}
                question={question}
                index={index}
                disabled={isPending}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="border-t border-line bg-[#fbfaff] px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          Add another question
        </Button>
      </div>
    </div>
  );
}
