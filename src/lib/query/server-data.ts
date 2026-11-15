import "server-only";

import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { formatDateLabel } from "@/lib/utils";

import { toQuestionItem } from "./map";
import type {
  LibraryOption,
  LibraryPageData,
  LibrarySummary,
  SubjectPageData,
} from "./types";

export async function loadLibraries(): Promise<LibrarySummary[]> {
  const user = await requireUser();

  const libraries = await db.library.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { subjects: true } },
      subjects: { select: { _count: { select: { questions: true } } } },
    },
  });

  return libraries.map((library) => ({
    id: library.id,
    name: library.name,
    subjectCount: library._count.subjects,
    questionCount: library.subjects.reduce(
      (total, subject) => total + subject._count.questions,
      0,
    ),
    createdLabel: formatDateLabel(library.createdAt),
  }));
}

export async function loadLibraryOptions(): Promise<LibraryOption[]> {
  const user = await requireUser();

  return db.library.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
}

export async function loadLibrary(
  libraryId: string,
): Promise<LibraryPageData | null> {
  const user = await requireUser();

  const library = await db.library.findFirst({
    where: { id: libraryId, ownerId: user.id },
    include: {
      subjects: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { questions: true } },
          questions: { select: { timeLimit: true } },
        },
      },
    },
  });

  if (!library) return null;

  return {
    library: {
      id: library.id,
      name: library.name,
      createdLabel: formatDateLabel(library.createdAt),
    },
    subjects: library.subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      questionCount: subject._count.questions,
      totalSeconds: subject.questions.reduce(
        (total, question) => total + question.timeLimit,
        0,
      ),
      updatedLabel: formatDateLabel(subject.updatedAt),
    })),
  };
}

export async function loadSubject(
  libraryId: string,
  subjectId: string,
): Promise<SubjectPageData | null> {
  const user = await requireUser();

  const subject = await db.subject.findFirst({
    where: {
      id: subjectId,
      libraryId,
      library: { ownerId: user.id },
    },
    include: {
      library: { select: { id: true, name: true } },
      questions: {
        orderBy: { position: "asc" },
        include: {
          answers: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  if (!subject) return null;

  return {
    library: { id: subject.library.id, name: subject.library.name },
    subject: {
      id: subject.id,
      name: subject.name,
      createdLabel: formatDateLabel(subject.createdAt),
    },
    questions: subject.questions.map(toQuestionItem),
  };
}
