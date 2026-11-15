"use server";

import {
  loadLibraries,
  loadLibrary,
  loadLibraryOptions,
  loadSubject,
} from "@/lib/query/server-data";
import type { LibraryPageData, SubjectPageData } from "@/lib/query/types";

export async function getLibraries() {
  return loadLibraries();
}

export async function getLibraryOptions() {
  return loadLibraryOptions();
}

export async function getLibrary(
  libraryId: string,
): Promise<LibraryPageData> {
  const data = await loadLibrary(libraryId);

  if (!data) throw new Error("Library not found.");

  return data;
}

export async function getSubject(
  libraryId: string,
  subjectId: string,
): Promise<SubjectPageData> {
  const data = await loadSubject(libraryId, subjectId);

  if (!data) throw new Error("Subject not found.");

  return data;
}
