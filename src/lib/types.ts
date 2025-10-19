export interface Plaibook {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  published?: boolean;
  questions?: SavedQuestion[];
  selectedDocuments?: string[]; // IDs of selected documents from inventory
}

export interface GeneratedAnswer {
  text: string;
  provider: string;
  model: string;
  timestamp: number;
}

export interface SavedQuestion {
  id: string;
  question: string;
  answer?: string; // Legacy field for backward compatibility
  answers?: GeneratedAnswer[]; // New field for multiple answers
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
