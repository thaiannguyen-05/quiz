import type { QueryClient } from "@tanstack/react-query";

import { formatDateLabel } from "@/lib/utils";

import { queryKeys } from "./keys";
import type {
  LibraryOption,
  LibraryPageData,
  LibrarySummary,
  QuestionItem,
  SubjectPageData,
  SubjectSummary,
} from "./types";

export type ImportCacheResult = {
  subjectId: string;
  subjectName: string;
  questionCount: number;
  totalSeconds: number;
  previousQuestionCount: number;
  mode?: "new" | "replace" | "append";
};

function adjustLibraryCounts(
  queryClient: QueryClient,
  libraryId: string,
  subjectDelta: number,
  questionDelta: number,
) {
  if (subjectDelta === 0 && questionDelta === 0) return;

  queryClient.setQueryData<LibrarySummary[]>(
    queryKeys.libraries,
    (libraries) =>
      libraries?.map((library) =>
        library.id === libraryId
          ? {
              ...library,
              subjectCount: Math.max(0, library.subjectCount + subjectDelta),
              questionCount: Math.max(
                0,
                library.questionCount + questionDelta,
              ),
            }
          : library,
      ),
  );
}

function patchSubject(
  queryClient: QueryClient,
  libraryId: string,
  subjectId: string,
  patch: Partial<SubjectSummary>,
) {
  queryClient.setQueryData<LibraryPageData>(
    queryKeys.library(libraryId),
    (data) =>
      data
        ? {
            ...data,
            subjects: data.subjects.map((subject) =>
              subject.id === subjectId
                ? { ...subject, ...patch }
                : subject,
            ),
          }
        : data,
  );
}

export function addLibraryToCache(
  queryClient: QueryClient,
  library: { id: string; name: string },
) {
  const summary: LibrarySummary = {
    id: library.id,
    name: library.name,
    subjectCount: 0,
    questionCount: 0,
    createdLabel: formatDateLabel(new Date()),
  };

  queryClient.setQueryData<LibrarySummary[]>(
    queryKeys.libraries,
    (libraries) => (libraries ? [...libraries, summary] : [summary]),
  );

  queryClient.setQueryData<LibraryOption[]>(
    queryKeys.libraryOptions,
    (options) =>
      options
        ? [...options, { id: library.id, name: library.name }]
        : [{ id: library.id, name: library.name }],
  );
}

export function renameLibraryInCache(
  queryClient: QueryClient,
  libraryId: string,
  name: string,
) {
  queryClient.setQueryData<LibrarySummary[]>(
    queryKeys.libraries,
    (libraries) =>
      libraries?.map((library) =>
        library.id === libraryId ? { ...library, name } : library,
      ),
  );

  queryClient.setQueryData<LibraryOption[]>(
    queryKeys.libraryOptions,
    (options) =>
      options?.map((option) =>
        option.id === libraryId ? { ...option, name } : option,
      ),
  );

  queryClient.setQueryData<LibraryPageData>(
    queryKeys.library(libraryId),
    (data) =>
      data ? { ...data, library: { ...data.library, name } } : data,
  );
}

export function removeLibraryFromCache(
  queryClient: QueryClient,
  libraryId: string,
) {
  queryClient.setQueryData<LibrarySummary[]>(
    queryKeys.libraries,
    (libraries) =>
      libraries?.filter((library) => library.id !== libraryId),
  );

  queryClient.setQueryData<LibraryOption[]>(
    queryKeys.libraryOptions,
    (options) => options?.filter((option) => option.id !== libraryId),
  );

  queryClient.removeQueries({ queryKey: queryKeys.library(libraryId) });
  queryClient.removeQueries({ queryKey: queryKeys.subjects(libraryId) });
}

export function addSubjectToCache(
  queryClient: QueryClient,
  libraryId: string,
  subject: { id: string; name: string },
) {
  const summary: SubjectSummary = {
    id: subject.id,
    name: subject.name,
    questionCount: 0,
    totalSeconds: 0,
    updatedLabel: formatDateLabel(new Date()),
  };

  queryClient.setQueryData<LibraryPageData>(
    queryKeys.library(libraryId),
    (data) =>
      data && !data.subjects.some((item) => item.id === subject.id)
        ? { ...data, subjects: [...data.subjects, summary] }
        : data,
  );

  adjustLibraryCounts(queryClient, libraryId, 1, 0);
}

export function renameSubjectInCache(
  queryClient: QueryClient,
  libraryId: string,
  subjectId: string,
  name: string,
) {
  patchSubject(queryClient, libraryId, subjectId, {
    name,
    updatedLabel: formatDateLabel(new Date()),
  });

  queryClient.setQueryData<SubjectPageData>(
    queryKeys.subject(libraryId, subjectId),
    (data) =>
      data ? { ...data, subject: { ...data.subject, name } } : data,
  );
}

export function removeSubjectFromCache(
  queryClient: QueryClient,
  libraryId: string,
  subjectId: string,
  fallbackQuestionCount: number,
) {
  const data = queryClient.getQueryData<LibraryPageData>(
    queryKeys.library(libraryId),
  );
  const existing = data?.subjects.find(
    (subject) => subject.id === subjectId,
  );

  if (data) {
    queryClient.setQueryData<LibraryPageData>(queryKeys.library(libraryId), {
      ...data,
      subjects: data.subjects.filter((subject) => subject.id !== subjectId),
    });
  }

  adjustLibraryCounts(
    queryClient,
    libraryId,
    -1,
    -(existing?.questionCount ?? fallbackQuestionCount),
  );

  queryClient.removeQueries({
    queryKey: queryKeys.subject(libraryId, subjectId),
  });
}

function bumpSubjectTotals(
  queryClient: QueryClient,
  libraryId: string,
  subjectId: string,
  questionDelta: number,
  secondsDelta: number,
) {
  patchSubject(queryClient, libraryId, subjectId, {
    updatedLabel: formatDateLabel(new Date()),
  });

  queryClient.setQueryData<LibraryPageData>(
    queryKeys.library(libraryId),
    (data) =>
      data
        ? {
            ...data,
            subjects: data.subjects.map((subject) =>
              subject.id === subjectId
                ? {
                    ...subject,
                    questionCount: Math.max(
                      0,
                      subject.questionCount + questionDelta,
                    ),
                    totalSeconds: Math.max(
                      0,
                      subject.totalSeconds + secondsDelta,
                    ),
                  }
                : subject,
            ),
          }
        : data,
  );

  adjustLibraryCounts(queryClient, libraryId, 0, questionDelta);
}

export function upsertQuestionInCache(
  queryClient: QueryClient,
  libraryId: string,
  subjectId: string,
  question: QuestionItem,
) {
  const key = queryKeys.subject(libraryId, subjectId);
  const data = queryClient.getQueryData<SubjectPageData>(key);

  if (!data) return;

  const existing = data.questions.find((item) => item.id === question.id);
  const questions = existing
    ? data.questions.map((item) =>
        item.id === question.id ? question : item,
      )
    : [...data.questions, question];

  queryClient.setQueryData<SubjectPageData>(key, { ...data, questions });

  bumpSubjectTotals(
    queryClient,
    libraryId,
    subjectId,
    existing ? 0 : 1,
    question.timeLimit - (existing?.timeLimit ?? 0),
  );
}

export function removeQuestionFromCache(
  queryClient: QueryClient,
  libraryId: string,
  subjectId: string,
  question: QuestionItem,
) {
  const key = queryKeys.subject(libraryId, subjectId);

  queryClient.setQueryData<SubjectPageData>(key, (data) =>
    data
      ? {
          ...data,
          questions: data.questions.filter(
            (item) => item.id !== question.id,
          ),
        }
      : data,
  );

  bumpSubjectTotals(
    queryClient,
    libraryId,
    subjectId,
    -1,
    -question.timeLimit,
  );
}

export function markSubjectUpdated(
  queryClient: QueryClient,
  libraryId: string,
  subjectId: string,
) {
  patchSubject(queryClient, libraryId, subjectId, {
    updatedLabel: formatDateLabel(new Date()),
  });
}

export function applyImportToCache(
  queryClient: QueryClient,
  libraryId: string,
  result: ImportCacheResult,
) {
  const data = queryClient.getQueryData<LibraryPageData>(
    queryKeys.library(libraryId),
  );
  const subjectExists = data
    ? data.subjects.some((subject) => subject.id === result.subjectId)
    : result.mode === "append" || result.mode === "replace";

  const summary: SubjectSummary = {
    id: result.subjectId,
    name: result.subjectName,
    questionCount: result.questionCount,
    totalSeconds: result.totalSeconds,
    updatedLabel: formatDateLabel(new Date()),
  };

  if (data) {
    queryClient.setQueryData<LibraryPageData>(queryKeys.library(libraryId), {
      ...data,
      subjects: subjectExists
        ? data.subjects.map((subject) =>
            subject.id === result.subjectId ? summary : subject,
          )
        : [...data.subjects, summary],
    });
  }

  adjustLibraryCounts(
    queryClient,
    libraryId,
    subjectExists ? 0 : 1,
    result.questionCount - result.previousQuestionCount,
  );

  // The import writes new question and answer ids, so the old detail cache is
  // no longer trustworthy. The subject page re-seeds it from the server render.
  queryClient.removeQueries({
    queryKey: queryKeys.subject(libraryId, result.subjectId),
  });
}
