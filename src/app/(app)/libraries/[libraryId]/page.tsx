import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LibraryView } from "@/components/libraries/library-view";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Library" };

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ libraryId: string }>;
}) {
  const { libraryId } = await params;
  const user = await requireUser();

  const [library, libraries] = await Promise.all([
    db.library.findFirst({
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
    }),
    db.library.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!library) notFound();

  const subjects = library.subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    questionCount: subject._count.questions,
    totalSeconds: subject.questions.reduce(
      (total, question) => total + question.timeLimit,
      0,
    ),
    updatedLabel: dateFormatter.format(subject.updatedAt),
  }));

  return (
    <LibraryView
      library={{
        id: library.id,
        name: library.name,
        createdLabel: dateFormatter.format(library.createdAt),
      }}
      subjects={subjects}
      libraries={libraries}
    />
  );
}
