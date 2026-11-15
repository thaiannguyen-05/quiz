"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { failure, isUniqueConstraintError } from "@/lib/action-utils";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  firstZodError,
  importPayloadSchema,
  type ImportQuestionInput,
} from "@/lib/validation";

export type CommitImportResult =
  | { ok: true; subjectId: string; subjectName: string }
  | {
      ok: false;
      error: string;
      code?: "NAME_EXISTS" | "INVALID" | "NOT_FOUND";
      existingSubjectId?: string;
      existingQuestionCount?: number;
    };

function buildQuestions(
  questions: ImportQuestionInput[],
  startPosition = 0,
): Prisma.QuestionCreateWithoutSubjectInput[] {
  return questions.map((question, index) => ({
    text: question.text,
    timeLimit: question.timeLimit,
    position: startPosition + index,
    answers: {
      create: question.answers.map((text, answerIndex) => ({
        text,
        position: answerIndex,
        isCorrect: question.correctIndices.includes(answerIndex),
      })),
    },
  }));
}

function withSuffix(base: string, suffix: string) {
  const available = Math.max(1, 80 - suffix.length);
  return `${base.slice(0, available)}${suffix}`;
}

async function findAvailableSubjectName(libraryId: string, base: string) {
  const subjects = await db.subject.findMany({
    where: { libraryId },
    select: { name: true },
  });
  const names = new Set(subjects.map((subject) => subject.name));

  if (!names.has(base)) return base;

  let suffixNumber = 2;
  while (
    names.has(withSuffix(base, ` (${suffixNumber})`))
  ) {
    suffixNumber += 1;
  }

  return withSuffix(base, ` (${suffixNumber})`);
}

export async function commitImport(input: {
  libraryId: string;
  subjectName: string;
  mode?: "new" | "replace" | "append";
  questions: ImportQuestionInput[];
}): Promise<CommitImportResult> {
  const user = await requireUser();
  const parsed = importPayloadSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ...failure(firstZodError(parsed.error), "INVALID"),
      code: "INVALID",
    };
  }

  const { libraryId, subjectName, mode, questions } = parsed.data;

  const library = await db.library.findFirst({
    where: { id: libraryId, ownerId: user.id },
    select: { id: true },
  });

  if (!library) {
    return { ...failure("Library not found.", "NOT_FOUND"), code: "NOT_FOUND" };
  }

  const existing = await db.subject.findFirst({
    where: { libraryId: library.id, name: subjectName },
    include: { _count: { select: { questions: true } } },
  });

  if (existing && !mode) {
    return {
      ok: false,
      error: `A subject named "${subjectName}" already exists in this library.`,
      code: "NAME_EXISTS",
      existingSubjectId: existing.id,
      existingQuestionCount: existing._count.questions,
    };
  }

  try {
    const result = await db.$transaction(
      async (tx) => {
        if (existing && mode === "replace") {
          await tx.question.deleteMany({ where: { subjectId: existing.id } });
          return tx.subject.update({
            where: { id: existing.id },
            data: {
              name: subjectName,
              questions: { create: buildQuestions(questions) },
            },
            select: { id: true, name: true },
          });
        }

        if (existing && mode === "append") {
          const lastQuestion = await tx.question.findFirst({
            where: { subjectId: existing.id },
            orderBy: { position: "desc" },
            select: { position: true },
          });
          const startPosition = (lastQuestion?.position ?? -1) + 1;

          return tx.subject.update({
            where: { id: existing.id },
            data: {
              questions: {
                create: buildQuestions(questions, startPosition),
              },
            },
            select: { id: true, name: true },
          });
        }

        const finalName =
          mode === "new" && existing
            ? await findAvailableSubjectName(library.id, subjectName)
            : subjectName;

        return tx.subject.create({
          data: {
            libraryId: library.id,
            name: finalName,
            questions: { create: buildQuestions(questions) },
          },
          select: { id: true, name: true },
        });
      },
      { timeout: 20_000 },
    );

    revalidatePath("/libraries");
    revalidatePath(`/libraries/${library.id}`);
    revalidatePath(`/libraries/${library.id}/subjects/${result.id}`);
    revalidatePath(`/play/${library.id}/${result.id}`);

    return { ok: true, subjectId: result.id, subjectName: result.name };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        error: "A subject with that name already exists in this library.",
        code: "INVALID",
      };
    }
    throw error;
  }
}
