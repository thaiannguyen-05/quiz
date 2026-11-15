import { describe, expect, it } from "vitest";

import {
  createCsvTemplate,
  parseQuizCsv,
  subjectNameFromFileName,
} from "@/lib/csv";

const BLOOKET_FIXTURE = `,,,,,,,
Question #,Question Text,Answer 1,Answer 2,"Answer 3 
(Optional)","Answer 4 
(Optional)","Time Limit (sec) 
(Max: 300 Seconds)","Correct Answer(s) 
(Only Include Answer #)"
1,"What is 2 + 2?",3,4,5,,40,2
2,"Which of these are vowels?","A","B","C","D",30,"1,3"
3, ,x,y,,,40,1
4,"No correct answer",x,y,,,40,
5,"Out of range",x,y,,,40,9
6,"Gapped answers",x,y,,Z,40,1
7,"Slow question",x,y,,,999,1
8,"Duplicate answers",x,x,,,40,1
,,,,,,,
`;

describe("parseQuizCsv", () => {
  it("reads the Blooket layout with a blank first row and multi-line headers", () => {
    const result = parseQuizCsv(BLOOKET_FIXTURE);

    expect(result.headerRowNumber).toBe(2);
    expect(result.fileErrors).toEqual([]);
    expect(result.questions).toHaveLength(8);
  });

  it("parses valid rows into questions, answers, and correct indices", () => {
    const result = parseQuizCsv(BLOOKET_FIXTURE);
    const first = result.questions[0];
    const second = result.questions[1];

    expect(first).toMatchObject({
      rowNumber: 3,
      questionNumber: "1",
      text: "What is 2 + 2?",
      answers: ["3", "4", "5"],
      correctIndices: [1],
      timeLimit: 40,
      errors: [],
    });

    expect(second).toMatchObject({
      text: "Which of these are vowels?",
      answers: ["A", "B", "C", "D"],
      correctIndices: [0, 2],
      timeLimit: 30,
    });
  });

  it("flags rows that cannot be imported", () => {
    const result = parseQuizCsv(BLOOKET_FIXTURE);
    const byNumber = new Map(
      result.questions.map((question) => [question.questionNumber, question]),
    );

    expect(byNumber.get("3")?.errors).toContain("Question text is missing.");
    expect(byNumber.get("4")?.errors).toContain(
      "Mark at least one correct answer (1-4).",
    );
    expect(byNumber.get("5")?.errors).toContain(
      'Correct answer "9" is out of range (1-4).',
    );
    expect(byNumber.get("6")?.errors).toContain(
      "Answers must be filled in order, without gaps.",
    );
  });

  it("caps large time limits and warns about duplicates", () => {
    const result = parseQuizCsv(BLOOKET_FIXTURE);
    const slow = result.questions.find(
      (question) => question.questionNumber === "7",
    );
    const duplicate = result.questions.find(
      (question) => question.questionNumber === "8",
    );

    expect(slow?.timeLimit).toBe(300);
    expect(slow?.warnings).toContain("Time limit was capped at 300 seconds.");
    expect(duplicate?.warnings).toContain(
      "This question has duplicate answer text.",
    );
  });

  it("ignores trailing blank rows", () => {
    const result = parseQuizCsv(BLOOKET_FIXTURE);

    expect(result.questions.map((question) => question.rowNumber)).toEqual([
      3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("skips numbered but otherwise empty placeholder rows", () => {
    const result = parseQuizCsv(
      [
        "Question #,Question Text,Answer 1,Answer 2,Correct Answer(s)",
        "1,Real question,yes,no,1",
        "2,,,,",
        "3,,,,",
      ].join("\n"),
    );

    expect(result.fileErrors).toEqual([]);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]?.text).toBe("Real question");
  });

  it("returns a file error when the header row is missing", () => {
    const result = parseQuizCsv("1,2,3\n4,5,6\n");

    expect(result.questions).toEqual([]);
    expect(result.headerRowNumber).toBeNull();
    expect(result.fileErrors[0]).toMatch(/Could not find the header row/);
  });

  it("defaults to 40 seconds when there is no time limit column", () => {
    const result = parseQuizCsv(
      [
        "Question Text,Answer 1,Answer 2,Correct Answer(s)",
        "Pick one,yes,no,1",
      ].join("\n"),
    );

    expect(result.questions[0]?.timeLimit).toBe(40);
    expect(result.warnings).toContain(
      "No time limit column found; every question will use 40 seconds.",
    );
  });

  it("round-trips the downloadable template", () => {
    const result = parseQuizCsv(createCsvTemplate());

    expect(result.fileErrors).toEqual([]);
    expect(result.questions).toHaveLength(2);
    expect(result.questions.every((question) => question.errors.length === 0)).toBe(
      true,
    );
    expect(result.questions[1].correctIndices).toEqual([0, 2]);
  });
});

describe("subjectNameFromFileName", () => {
  it("strips the extension and tidies separators", () => {
    expect(subjectNameFromFileName("An3.csv")).toBe("An3");
    expect(subjectNameFromFileName("chapter_4-practice.csv")).toBe(
      "chapter 4 practice",
    );
  });

  it("falls back when the file name is empty", () => {
    expect(subjectNameFromFileName(".csv")).toBe("Imported subject");
  });
});
