export interface Plaibook {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  questions?: SavedQuestion[];
}

export interface SavedQuestion {
  id: string;
  question: string;
  answer?: string;
  feedback?: Feedback;
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
  thumbsUp: boolean;
  score: number;
}
