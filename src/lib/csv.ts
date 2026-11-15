import Papa from "papaparse";

export const DEFAULT_TIME_LIMIT = 40;
export const MAX_TIME_LIMIT = 300;

export type ParsedQuestion = {
  /** 1-based record number in the CSV, useful in the preview. */
  rowNumber: number;
  questionNumber: string | null;
  text: string;
  answers: string[];
  correctIndices: number[];
  timeLimit: number;
  errors: string[];
  warnings: string[];
};

export type CsvParseResult = {
  questions: ParsedQuestion[];
  headerRowNumber: number | null;
  fileErrors: string[];
  warnings: string[];
};

function cleanCell(value: string | null | undefined) {
  return (value ?? "").replace(/\uFEFF/g, "").trim();
}

function normalizeHeader(value: string) {
  return cleanCell(value).replace(/\s+/g, " ").toLowerCase();
}

function unique(values: string[]) {
  return [...new Set(values)];
}

/**
 * Parses the Blooket-style CSV used by the app.
 *
 * The reader is deliberately tolerant:
 * - blank leading/trailing rows are ignored
 * - the header row is detected wherever it appears
 * - headers may contain line breaks and "(Optional)" suffixes
 * - quoted commas / newlines are handled by Papa Parse
 * - "Correct Answer(s)" accepts formats such as "2" or "1,3"
 */
export function parseQuizCsv(input: string): CsvParseResult {
  const fileErrors: string[] = [];
  const warnings: string[] = [];

  const result = Papa.parse<string[]>(input.replace(/^\uFEFF/, ""), {
    skipEmptyLines: false,
  });

  const rows = result.data.map((row) =>
    Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : [],
  );

  for (const error of result.errors) {
    const where =
      typeof error.row === "number" ? ` near row ${error.row + 1}` : "";
    fileErrors.push(`CSV parse issue${where}: ${error.message}`);
  }

  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => normalizeHeader(cell).startsWith("question text")),
  );

  if (headerIndex === -1) {
    return {
      questions: [],
      headerRowNumber: null,
      fileErrors: [
        "Could not find the header row. Expected a column named \"Question Text\".",
        ...unique(fileErrors),
      ],
      warnings,
    };
  }

  const headers = rows[headerIndex].map(normalizeHeader);

  const findColumn = (predicate: (header: string) => boolean) =>
    headers.findIndex(predicate);

  const questionTextColumn = findColumn((header) =>
    header.startsWith("question text"),
  );
  const questionNumberColumn = findColumn(
    (header) =>
      header === "question #" ||
      header.startsWith("question #") ||
      header === "question number" ||
      header === "question no.",
  );
  const answerColumns = [1, 2, 3, 4].map((number) =>
    findColumn((header) => new RegExp(`^answer\\s*${number}\\b`).test(header)),
  );
  const timeLimitColumn = findColumn(
    (header) =>
      header.startsWith("time limit") ||
      header === "time" ||
      header === "seconds",
  );
  const correctColumn = findColumn(
    (header) => header.startsWith("correct answer") || header === "correct",
  );

  if (correctColumn === -1) {
    fileErrors.push(
      "Missing the \"Correct Answer(s)\" column. Add it and try again.",
    );
  }

  const missingAnswers = answerColumns
    .slice(0, 2)
    .some((column) => column === -1);
  if (questionTextColumn === -1 || missingAnswers) {
    fileErrors.push(
      "Missing a required column. The file needs \"Question Text\", \"Answer 1\" and \"Answer 2\".",
    );
  }

  if (timeLimitColumn === -1) {
    warnings.push(
      `No time limit column found; every question will use ${DEFAULT_TIME_LIMIT} seconds.`,
    );
  }

  if (fileErrors.length > 0) {
    return {
      questions: [],
      headerRowNumber: headerIndex + 1,
      fileErrors: unique(fileErrors),
      warnings: unique(warnings),
    };
  }

  const getCell = (row: string[], column: number) =>
    column >= 0 ? cleanCell(row[column]) : "";

  const questions: ParsedQuestion[] = [];

  for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const rowNumber = rowIndex + 1;

    if (row.every((cell) => cleanCell(cell) === "")) continue;

    const errors: string[] = [];
    const rowWarnings: string[] = [];

    const text = getCell(row, questionTextColumn);
    const questionNumber = getCell(row, questionNumberColumn) || null;
    const rawAnswers = answerColumns.map((column) => getCell(row, column));
    const rawCorrect = getCell(row, correctColumn);

    // Blooket exports often leave numbered but otherwise empty rows at the
    // bottom of the sheet. They are placeholders, not broken questions.
    if (!text && !rawCorrect && rawAnswers.every((answer) => !answer)) {
      continue;
    }

    if (!text) errors.push("Question text is missing.");
    if (text.length > 2000) {
      errors.push("Question text must be 2,000 characters or fewer.");
    }

    const firstEmptyAnswer = rawAnswers.findIndex((answer) => !answer);

    if (
      firstEmptyAnswer !== -1 &&
      rawAnswers.slice(firstEmptyAnswer + 1).some(Boolean)
    ) {
      errors.push("Answers must be filled in order, without gaps.");
    }

    const answers = rawAnswers.filter(Boolean);

    if (answers.length < 2) {
      errors.push("At least two answers are required.");
    }
    if (answers.some((answer) => answer.length > 500)) {
      errors.push("An answer must be 500 characters or fewer.");
    }

    const normalizedAnswers = answers.map((answer) => answer.toLowerCase());
    if (new Set(normalizedAnswers).size !== normalizedAnswers.length) {
      rowWarnings.push("This question has duplicate answer text.");
    }

    const correctTokens = rawCorrect.match(/\d+/g) ?? [];
    if (correctTokens.length === 0) {
      errors.push("Mark at least one correct answer (1-4).");
    }

    const correctIndices: number[] = [];
    for (const token of correctTokens) {
      const answerNumber = Number(token);
      if (
        !Number.isInteger(answerNumber) ||
        answerNumber < 1 ||
        answerNumber > 4
      ) {
        errors.push(`Correct answer "${token}" is out of range (1-4).`);
        continue;
      }
      if (!rawAnswers[answerNumber - 1]) {
        errors.push(
          `Correct answer ${answerNumber} points to an empty answer.`,
        );
        continue;
      }
      if (!correctIndices.includes(answerNumber - 1)) {
        correctIndices.push(answerNumber - 1);
      }
    }

    const rawTimeLimit = getCell(row, timeLimitColumn);
    let timeLimit = DEFAULT_TIME_LIMIT;

    if (rawTimeLimit) {
      const parsedTimeLimit = Number(rawTimeLimit);
      if (!Number.isFinite(parsedTimeLimit)) {
        rowWarnings.push(
          `Time limit "${rawTimeLimit}" is not a number; using ${DEFAULT_TIME_LIMIT} seconds.`,
        );
      } else {
        const rounded = Math.round(parsedTimeLimit);
        if (rounded < 1) {
          timeLimit = 1;
          rowWarnings.push("Time limit was raised to 1 second.");
        } else if (rounded > MAX_TIME_LIMIT) {
          timeLimit = MAX_TIME_LIMIT;
          rowWarnings.push(
            `Time limit was capped at ${MAX_TIME_LIMIT} seconds.`,
          );
        } else {
          timeLimit = rounded;
        }
      }
    }

    questions.push({
      rowNumber,
      questionNumber,
      text,
      answers,
      correctIndices,
      timeLimit,
      errors: unique(errors),
      warnings: unique(rowWarnings),
    });
  }

  if (questions.length === 0) {
    fileErrors.push("No question rows were found in this file.");
  }

  return {
    questions,
    headerRowNumber: headerIndex + 1,
    fileErrors: unique(fileErrors),
    warnings: unique(warnings),
  };
}

export async function parseQuizFile(file: File): Promise<CsvParseResult> {
  return parseQuizCsv(await file.text());
}

export function subjectNameFromFileName(fileName: string) {
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();

  return (base || "Imported subject").slice(0, 80);
}

export function createCsvTemplate() {
  return `\uFEFF${Papa.unparse([
    [
      "Question #",
      "Question Text",
      "Answer 1",
      "Answer 2",
      "Answer 3 (Optional)",
      "Answer 4 (Optional)",
      "Time Limit (sec)",
      "Correct Answer(s)",
    ],
    [
      "1",
      "What is 2 + 2?",
      "3",
      "4",
      "5",
      "",
      "40",
      "2",
    ],
    [
      "2",
      "Which of these are vowels?",
      "A",
      "B",
      "C",
      "D",
      "40",
      "1,3",
    ],
  ])}`;
}
