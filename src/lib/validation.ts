import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name must be 80 characters or fewer");

export const questionInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "Question text is required")
      .max(2000, "Question text must be 2,000 characters or fewer"),
    answers: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Answers cannot be empty")
          .max(500, "An answer must be 500 characters or fewer"),
      )
      .min(2, "At least two answers are required")
      .max(4, "At most four answers are supported"),
    correctIndices: z
      .array(z.number().int().min(0).max(3))
      .min(1, "Mark at least one correct answer"),
    timeLimit: z
      .number()
      .int()
      .min(1, "Time limit must be at least 1 second")
      .max(300, "Time limit cannot exceed 300 seconds"),
  })
  .superRefine((question, ctx) => {
    const seen = new Set<number>();
    for (const index of question.correctIndices) {
      if (index >= question.answers.length) {
        ctx.addIssue({
          code: "custom",
          message: "A correct answer is out of range",
          path: ["correctIndices"],
        });
        return;
      }
      if (seen.has(index)) {
        ctx.addIssue({
          code: "custom",
          message: "Duplicate correct answer",
          path: ["correctIndices"],
        });
        return;
      }
      seen.add(index);
    }
  });

export const importQuestionSchema = questionInputSchema;

export const importPayloadSchema = z.object({
  libraryId: z.string().min(1),
  subjectName: nameSchema,
  mode: z.enum(["new", "replace", "append"]).optional(),
  questions: z
    .array(importQuestionSchema)
    .min(1, "Select at least one question to import")
    .max(2000, "A single import is limited to 2,000 questions"),
});

export type ImportQuestionInput = z.infer<typeof importQuestionSchema>;

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}
