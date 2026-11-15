import { queryOptions } from "@tanstack/react-query";

import {
  getLibraries,
  getLibrary,
  getLibraryOptions,
  getSubject,
} from "@/actions/queries";

import { queryKeys } from "./keys";

export function librariesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.libraries,
    queryFn: getLibraries,
  });
}

export function libraryOptionsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.libraryOptions,
    queryFn: getLibraryOptions,
  });
}

export function libraryQueryOptions(libraryId: string) {
  return queryOptions({
    queryKey: queryKeys.library(libraryId),
    queryFn: () => getLibrary(libraryId),
  });
}

export function subjectQueryOptions(libraryId: string, subjectId: string) {
  return queryOptions({
    queryKey: queryKeys.subject(libraryId, subjectId),
    queryFn: () => getSubject(libraryId, subjectId),
  });
}
