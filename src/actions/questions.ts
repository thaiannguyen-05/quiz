"use server";

import { revalidatePath } from "next/cache";

import { failure } from "@/lib/action-utils";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  firstZodError,
  questionInputSchema,
  type ImportQuestionInput,
} from "@/lib/validation";

function buildAnswers(question: ImportQuestionInput) {
  return question.answers.map((text, index) => ({
    text,
    position: index,
    isCorrect: question.correctIndices.includes(index),
  }));
}

function revalidateSubjectPaths(libraryId: string, subjectId: string) {
  revalidatePath("/libraries");
  revalidatePath(`/libraries/${libraryId}`);
  revalidatePath(`/libraries/${libraryId}/subjects/${subjectId}`);
  revalidatePath(`/play/${libraryId}/${subjectId}`);
}

async function getOwnedSubject(userId: string, subjectId: string) {
  return db.subject.findFirst({
    where: { id: subjectId, library: { ownerId: userId } },
    select: { id: true, libraryId: true },
  });
}

export async function createQuestion(
  input: { subjectId: string } & ImportQuestionInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await requireUser();
  const subject = await getOwnedSubject(user.id, input.subjectId);

  if (!subject) {
    return failure("Subject not found.");
  }

  const parsed = questionInputSchema.safeParse({
    text: input.text,
    answers: input.answers,
    correctIndices: input.correctIndices,
    timeLimit: input.timeLimit,
  });

  if (!parsed.success) {
    return failure(firstZodError(parsed.error));
  }

  const lastQuestion = await db.question.findFirst({
    where: { subjectId: subject.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const question = await db.question.create({
    data: {
      subjectId: subject.id,
      text: parsed.data.text,
      timeLimit: parsed.data.timeLimit,
      position: (lastQuestion?.position ?? -1) + 1,
      answers: { create: buildAnswers(parsed.data) },
    },
    select: { id: true },
  });

  await db.subject.update({
    where: { id: subject.id },
    data: { updatedAt: new Date() },
  });

  revalidateSubjectPaths(subject.libraryId, subject.id);

  return { ok: true, id: question.id };
}

export async function updateQuestion(
  input: { questionId: string } & ImportQuestionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();

  const question = await db.question.findFirst({
    where: {
      id: input.questionId,
      subject: { library: { ownerId: user.id } },
    },
    select: { id: true, subjectId: true, subject: { select: { libraryId: true } } },
  });

  if (!question) {
    return failure("Question not found.");
  }

  const parsed = questionInputSchema.safeParse({
    text: input.text,
    answers: input.answers,
    correctIndices: input.correctIndices,
    timeLimit: input.timeLimit,
  });

  if (!parsed.success) {
    return failure(firstZodError(parsed.error));
  }

  await db.$transaction([
    db.answer.deleteMany({ where: { questionId: question.id } }),
    db.question.update({
      where: { id: question.id },
      data: {
        text: parsed.data.text,
        timeLimit: parsed.data.timeLimit,
        answers: { create: buildAnswers(parsed.data) },
      },
    }),
    db.subject.update({
      where: { id: question.subjectId },
      data: { updatedAt: new Date() },
    }),
  ]);

  revalidateSubjectPaths(question.subject.libraryId, question.subjectId);

  return { ok: true };
}

export async function deleteQuestion(input: {
  questionId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();

  const question = await db.question.findFirst({
    where: {
      id: input.questionId,
      subject: { library: { ownerId: user.id } },
    },
    select: { id: true, subjectId: true, subject: { select: { libraryId: true } } },
  });

  if (!question) {
    return failure("Question not found.");
  }

  await db.$transaction([
    db.question.delete({ where: { id: question.id } }),
    db.subject.update({
      where: { id: question.subjectId },
      data: { updatedAt: new Date() },
    }),
  ]);

  revalidateSubjectPaths(question.subject.libraryId, question.subjectId);

  return { ok: true };
}

export async function reorderQuestions(input: {
  subjectId: string;
  questionIds: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const subject = await getOwnedSubject(user.id, input.subjectId);

  if (!subject) {
    return failure("Subject not found.");
  }

  const ids = input.questionIds;
  if (new Set(ids).size !== ids.length) {
    return failure("Question order is invalid.");
  }

  const existing = await db.question.findMany({
    where: { subjectId: subject.id },
    select: { id: true },
  });

  const existingIds = new Set(existing.map((question) => question.id));
  if (
    existing.length !== ids.length ||
    !ids.every((id) => existingIds.has(id))
  ) {
    return failure("Question order is out of date. Refresh and try again.");
  }

  await db.$transaction(
    ids.map((id, index) =>
      db.question.update({ where: { id }, data: { position: index } }),
    ),
  );

  await db.subject.update({
    where: { id: subject.id },
    data: { updatedAt: new Date() },
  });

  revalidateSubjectPaths(subject.libraryId, subject.id);

  return { ok: true };
}
