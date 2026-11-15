import type { QuestionItem } from "./types";

type QuestionWithAnswers = {
  id: string;
  text: string;
  timeLimit: number;
  position: number;
  answers: {
    id: string;
    text: string;
    isCorrect: boolean;
    position: number;
  }[];
};

export function toQuestionItem(question: QuestionWithAnswers): QuestionItem {
  return {
    id: question.id,
    text: question.text,
    timeLimit: question.timeLimit,
    position: question.position,
    answers: question.answers.map((answer) => ({
      id: answer.id,
      text: answer.text,
      isCorrect: answer.isCorrect,
      position: answer.position,
    })),
  };
}
