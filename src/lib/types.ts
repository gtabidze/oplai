export interface Plaibook {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Question {
  id: string;
  text: string;
}

export interface Answer {
  questionId: string;
  text: string;
}

export interface Feedback {
  questionId: string;
  helpful: boolean | null;
  score: number | null;
}
