import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import {
  addLibraryToCache,
  addSubjectToCache,
  applyImportToCache,
  removeLibraryFromCache,
  removeQuestionFromCache,
  removeSubjectFromCache,
  renameLibraryInCache,
  renameSubjectInCache,
  upsertQuestionInCache,
} from "./cache";
import { queryKeys } from "./keys";
import type {
  LibraryPageData,
  LibrarySummary,
  QuestionItem,
  SubjectPageData,
} from "./types";

const LIBRARY_ID = "library-1";
const SUBJECT_ID = "subject-1";

function question(id: string, timeLimit = 40): QuestionItem {
  return {
    id,
    text: `Question ${id}`,
    timeLimit,
    position: 0,
    answers: [{ id: `answer-${id}`, text: "A", isCorrect: true, position: 0 }],
  };
}

function setup() {
  const queryClient = new QueryClient();

  const library: LibrarySummary = {
    id: LIBRARY_ID,
    name: "Andev",
    subjectCount: 1,
    questionCount: 1,
    createdLabel: "Nov 15, 2026",
  };

  queryClient.setQueryData<LibrarySummary[]>(queryKeys.libraries, [library]);
  queryClient.setQueryData(queryKeys.libraryOptions, [
    { id: LIBRARY_ID, name: library.name },
  ]);
  queryClient.setQueryData<LibraryPageData>(queryKeys.library(LIBRARY_ID), {
    library: {
      id: LIBRARY_ID,
      name: library.name,
      createdLabel: library.createdLabel,
    },
    subjects: [
      {
        id: SUBJECT_ID,
        name: "An3",
        questionCount: 1,
        totalSeconds: 40,
        updatedLabel: "Nov 15, 2026",
      },
    ],
  });
  queryClient.setQueryData<SubjectPageData>(
    queryKeys.subject(LIBRARY_ID, SUBJECT_ID),
    {
      library: { id: LIBRARY_ID, name: library.name },
      subject: {
        id: SUBJECT_ID,
        name: "An3",
        createdLabel: "Nov 15, 2026",
      },
      questions: [question("q1")],
    },
  );

  return queryClient;
}

function librarySummary(queryClient: QueryClient) {
  return queryClient
    .getQueryData<LibrarySummary[]>(queryKeys.libraries)
    ?.find((library) => library.id === LIBRARY_ID);
}

function subjectSummary(queryClient: QueryClient) {
  return queryClient
    .getQueryData<LibraryPageData>(queryKeys.library(LIBRARY_ID))
    ?.subjects.find((subject) => subject.id === SUBJECT_ID);
}

describe("library cache updates", () => {
  it("adds a library to the list and the import options", () => {
    const queryClient = new QueryClient();

    addLibraryToCache(queryClient, { id: "library-2", name: "New" });

    expect(
      queryClient.getQueryData<LibrarySummary[]>(queryKeys.libraries),
    ).toHaveLength(1);
    expect(
      queryClient.getQueryData(queryKeys.libraryOptions),
    ).toEqual([{ id: "library-2", name: "New" }]);
  });

  it("renames a library everywhere it appears", () => {
    const queryClient = setup();

    renameLibraryInCache(queryClient, LIBRARY_ID, "Renamed");

    expect(librarySummary(queryClient)?.name).toBe("Renamed");
    expect(
      queryClient.getQueryData(queryKeys.libraryOptions),
    ).toEqual([{ id: LIBRARY_ID, name: "Renamed" }]);
    expect(
      queryClient.getQueryData<LibraryPageData>(queryKeys.library(LIBRARY_ID))
        ?.library.name,
    ).toBe("Renamed");
  });

  it("removes a library together with its subject caches", () => {
    const queryClient = setup();

    removeLibraryFromCache(queryClient, LIBRARY_ID);

    expect(
      queryClient.getQueryData<LibrarySummary[]>(queryKeys.libraries),
    ).toEqual([]);
    expect(queryClient.getQueryData(queryKeys.libraryOptions)).toEqual([]);
    expect(
      queryClient.getQueryData(queryKeys.library(LIBRARY_ID)),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(queryKeys.subject(LIBRARY_ID, SUBJECT_ID)),
    ).toBeUndefined();
  });
});

describe("subject cache updates", () => {
  it("adds a subject and bumps the library counts", () => {
    const queryClient = setup();

    addSubjectToCache(queryClient, LIBRARY_ID, {
      id: "subject-2",
      name: "Chapter 4",
    });

    expect(
      queryClient.getQueryData<LibraryPageData>(queryKeys.library(LIBRARY_ID))
        ?.subjects,
    ).toHaveLength(2);
    expect(librarySummary(queryClient)).toMatchObject({
      subjectCount: 2,
      questionCount: 1,
    });
  });

  it("renames a subject in the library and subject caches", () => {
    const queryClient = setup();

    renameSubjectInCache(queryClient, LIBRARY_ID, SUBJECT_ID, "Renamed");

    expect(subjectSummary(queryClient)?.name).toBe("Renamed");
    expect(
      queryClient.getQueryData<SubjectPageData>(
        queryKeys.subject(LIBRARY_ID, SUBJECT_ID),
      )?.subject.name,
    ).toBe("Renamed");
  });

  it("removes a subject and subtracts its questions", () => {
    const queryClient = setup();

    removeSubjectFromCache(queryClient, LIBRARY_ID, SUBJECT_ID, 1);

    expect(
      queryClient.getQueryData<LibraryPageData>(queryKeys.library(LIBRARY_ID))
        ?.subjects,
    ).toHaveLength(0);
    expect(librarySummary(queryClient)).toMatchObject({
      subjectCount: 0,
      questionCount: 0,
    });
    expect(
      queryClient.getQueryData(queryKeys.subject(LIBRARY_ID, SUBJECT_ID)),
    ).toBeUndefined();
  });

  it("applies an import to an existing subject without refetching", () => {
    const queryClient = setup();

    applyImportToCache(queryClient, LIBRARY_ID, {
      subjectId: SUBJECT_ID,
      subjectName: "An3",
      questionCount: 3,
      totalSeconds: 120,
      previousQuestionCount: 1,
      mode: "replace",
    });

    expect(subjectSummary(queryClient)).toMatchObject({
      questionCount: 3,
      totalSeconds: 120,
    });
    expect(librarySummary(queryClient)?.questionCount).toBe(3);
    expect(
      queryClient.getQueryData(queryKeys.subject(LIBRARY_ID, SUBJECT_ID)),
    ).toBeUndefined();
  });

  it("adds an imported subject to the library", () => {
    const queryClient = setup();

    applyImportToCache(queryClient, LIBRARY_ID, {
      subjectId: "subject-2",
      subjectName: "Imported",
      questionCount: 2,
      totalSeconds: 80,
      previousQuestionCount: 0,
      mode: "new",
    });

    expect(
      queryClient.getQueryData<LibraryPageData>(queryKeys.library(LIBRARY_ID))
        ?.subjects,
    ).toHaveLength(2);
    expect(librarySummary(queryClient)).toMatchObject({
      subjectCount: 2,
      questionCount: 3,
    });
  });
});

describe("question cache updates", () => {
  it("adds a question and bumps every count", () => {
    const queryClient = setup();

    upsertQuestionInCache(
      queryClient,
      LIBRARY_ID,
      SUBJECT_ID,
      question("q2", 30),
    );

    expect(
      queryClient.getQueryData<SubjectPageData>(
        queryKeys.subject(LIBRARY_ID, SUBJECT_ID),
      )?.questions,
    ).toHaveLength(2);
    expect(subjectSummary(queryClient)).toMatchObject({
      questionCount: 2,
      totalSeconds: 70,
    });
    expect(librarySummary(queryClient)?.questionCount).toBe(2);
  });

  it("updates a question and only adjusts the time delta", () => {
    const queryClient = setup();

    upsertQuestionInCache(
      queryClient,
      LIBRARY_ID,
      SUBJECT_ID,
      question("q1", 60),
    );

    expect(
      queryClient.getQueryData<SubjectPageData>(
        queryKeys.subject(LIBRARY_ID, SUBJECT_ID),
      )?.questions,
    ).toHaveLength(1);
    expect(subjectSummary(queryClient)).toMatchObject({
      questionCount: 1,
      totalSeconds: 60,
    });
    expect(librarySummary(queryClient)?.questionCount).toBe(1);
  });

  it("removes a question and subtracts its time", () => {
    const queryClient = setup();
    upsertQuestionInCache(
      queryClient,
      LIBRARY_ID,
      SUBJECT_ID,
      question("q2", 30),
    );

    removeQuestionFromCache(
      queryClient,
      LIBRARY_ID,
      SUBJECT_ID,
      question("q2", 30),
    );

    expect(
      queryClient.getQueryData<SubjectPageData>(
        queryKeys.subject(LIBRARY_ID, SUBJECT_ID),
      )?.questions,
    ).toHaveLength(1);
    expect(subjectSummary(queryClient)).toMatchObject({
      questionCount: 1,
      totalSeconds: 40,
    });
    expect(librarySummary(queryClient)?.questionCount).toBe(1);
  });
});
