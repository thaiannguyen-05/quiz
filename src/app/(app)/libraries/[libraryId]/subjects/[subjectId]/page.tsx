import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SubjectView } from "@/components/subjects/subject-view";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Subject" };

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function SubjectPage({
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
    <SubjectView
      library={{ id: subject.library.id, name: subject.library.name }}
      subject={{
        id: subject.id,
        name: subject.name,
        createdLabel: dateFormatter.format(subject.createdAt),
      }}
      questions={subject.questions.map((question) => ({
        id: question.id,
        text: question.text,
        timeLimit: question.timeLimit,
        position: question.position,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          text: answer.text,
          isCorrect: answer.isCorrect,
          position: answer.position,
        })),
      }))}
    />
  );
}
