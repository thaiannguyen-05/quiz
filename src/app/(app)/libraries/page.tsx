import type { Metadata } from "next";

import { LibrariesView } from "@/components/libraries/libraries-view";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Libraries" };

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function LibrariesPage() {
  const user = await requireUser();

  const libraries = await db.library.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { subjects: true } },
      subjects: { select: { _count: { select: { questions: true } } } },
    },
  });

  const data = libraries.map((library) => ({
    id: library.id,
    name: library.name,
    subjectCount: library._count.subjects,
    questionCount: library.subjects.reduce(
      (total, subject) => total + subject._count.questions,
      0,
    ),
    createdLabel: dateFormatter.format(library.createdAt),
  }));

  const firstName =
    user.name?.trim().split(/\s+/)[0] || user.email.split("@")[0];

  return <LibrariesView libraries={data} firstName={firstName} />;
}
