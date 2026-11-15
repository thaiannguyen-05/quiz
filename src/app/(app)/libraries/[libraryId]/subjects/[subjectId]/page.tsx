import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SubjectView } from "@/components/subjects/subject-view";
import { loadSubject } from "@/lib/query/server-data";

export const metadata: Metadata = { title: "Subject" };

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ libraryId: string; subjectId: string }>;
}) {
  const { libraryId, subjectId } = await params;

  const data = await loadSubject(libraryId, subjectId);

  if (!data) notFound();

  return <SubjectView initialData={data} />;
}
