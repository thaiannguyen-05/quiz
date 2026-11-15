export type LibrarySummary = {
  id: string;
  name: string;
  subjectCount: number;
  questionCount: number;
  createdLabel: string;
};

export type LibraryOption = { id: string; name: string };

export type LibraryDetail = {
  id: string;
  name: string;
  createdLabel: string;
};

export type SubjectSummary = {
  id: string;
  name: string;
  questionCount: number;
  totalSeconds: number;
  updatedLabel: string;
};

export type LibraryPageData = {
  library: LibraryDetail;
  subjects: SubjectSummary[];
};

export type SubjectInfo = {
  id: string;
  name: string;
  createdLabel: string;
};

export type SubjectAnswer = {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number;
};

export type QuestionItem = {
  id: string;
  text: string;
  timeLimit: number;
  position: number;
  answers: SubjectAnswer[];
};

export type SubjectPageData = {
  library: LibraryOption;
  subject: SubjectInfo;
  questions: QuestionItem[];
};
