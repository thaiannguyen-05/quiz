"use server";

import { failure, isUniqueConstraintError } from "@/lib/action-utils";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  firstZodError,
  importPayloadSchema,
  type ImportQuestionInput,
} from "@/lib/validation";

export type CommitImportResult =
  | {
      ok: true;
      subjectId: string;
      subjectName: string;
      questionCount: number;
      totalSeconds: number;
      previousQuestionCount: number;
    }
  | {
      ok: false;
      error: string;
      code?: "NAME_EXISTS" | "INVALID" | "NOT_FOUND";
      existingSubjectId?: string;
      existingQuestionCount?: number;
    };

async function findAvailableSubjectName(libraryId: string, base: string) {
  const subjects = await db.subject.findMany({
    where: { libraryId },
    select: { name: true },
  });
  const names = new Set(subjects.map((subject) => subject.name));

  if (!names.has(base)) return base;

  let suffixNumber = 2;
  while (true) {
    const suffix = ` (${suffixNumber})`;
    const candidate = `${base.slice(
      0,
      Math.max(1, 80 - suffix.length),
    )}${suffix}`;
    if (!names.has(candidate)) return candidate;
    suffixNumber += 1;
  }
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
        let subjectId: string;
        let finalName = subjectName;
        let startPosition = 0;

        if (existing && mode === "replace") {
          await tx.question.deleteMany({ where: { subjectId: existing.id } });
          await tx.subject.update({
            where: { id: existing.id },
            data: { name: subjectName, updatedAt: new Date() },
          });
          subjectId = existing.id;
        } else if (existing && mode === "append") {
          const lastQuestion = await tx.question.findFirst({
            where: { subjectId: existing.id },
            orderBy: { position: "desc" },
            select: { position: true },
          });
          startPosition = (lastQuestion?.position ?? -1) + 1;
          await tx.subject.update({
            where: { id: existing.id },
            data: { updatedAt: new Date() },
          });
          subjectId = existing.id;
        } else {
          if (mode === "new" && existing) {
            finalName = await findAvailableSubjectName(library.id, subjectName);
          }
          const created = await tx.subject.create({
            data: { libraryId: library.id, name: finalName },
            select: { id: true, name: true },
          });
          subjectId = created.id;
          finalName = created.name;
        }

        // Batch insert questions (createManyAndReturn gives us their ids).
        const createdQuestions = await tx.question.createManyAndReturn({
          data: questions.map((question, index) => ({
            subjectId,
            text: question.text,
            timeLimit: question.timeLimit,
            position: startPosition + index,
          })),
          select: { id: true, position: true },
        });

        const orderedQuestions = [...createdQuestions].sort(
          (left, right) => left.position - right.position,
        );

        // Batch insert answers for all questions in one statement.
        const answerData = orderedQuestions.flatMap((createdQuestion, index) => {
          const question = questions[index];
          return question.answers.map((text, answerIndex) => ({
            questionId: createdQuestion.id,
            text,
            position: answerIndex,
            isCorrect: question.correctIndices.includes(answerIndex),
          }));
        });

        if (answerData.length > 0) {
          await tx.answer.createMany({ data: answerData });
        }

        return { id: subjectId, name: finalName };
      },
      { timeout: 20_000 },
    );

    const summary = await db.subject.findUniqueOrThrow({
      where: { id: result.id },
      select: {
        _count: { select: { questions: true } },
        questions: { select: { timeLimit: true } },
      },
    });

    return {
      ok: true,
      subjectId: result.id,
      subjectName: result.name,
      questionCount: summary._count.questions,
      totalSeconds: summary.questions.reduce(
        (total, question) => total + question.timeLimit,
        0,
      ),
      previousQuestionCount:
        existing && existing.id === result.id ? existing._count.questions : 0,
    };
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