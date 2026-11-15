import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LibraryView } from "@/components/libraries/library-view";
import {
  loadLibrary,
  loadLibraryOptions,
} from "@/lib/query/server-data";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ libraryId: string }>;
}) {
  const { libraryId } = await params;

  const [data, libraries] = await Promise.all([
    loadLibrary(libraryId),
    loadLibraryOptions(),
  ]);

  if (!data) notFound();

  return (
    <LibraryView
      initialData={data}
      initialLibraries={libraries}
    />
  );
}
