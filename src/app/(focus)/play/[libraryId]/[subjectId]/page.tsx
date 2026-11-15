import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QuizPlayer } from "@/components/play/quiz-player";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Practice" };

export default async function PlayPage({
  params,
}: {
  params: Promise<{ libraryId: string; subjectId: string }>;
}) {
  const { libraryId, subjectId } = await params;
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

  if (!subject) notFound();

  return (
    <QuizPlayer
      library={{ id: subject.library.id, name: subject.library.name }}
      subject={{ id: subject.id, name: subject.name }}
      questions={subject.questions.map((question) => ({
        id: question.id,
        text: question.text,
        timeLimit: question.timeLimit,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          text: answer.text,
          isCorrect: answer.isCorrect,
        })),
      }))}
    />
  );
}
