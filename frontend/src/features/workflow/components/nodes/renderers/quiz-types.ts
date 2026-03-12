export interface QuizQuestion {
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: string;
  source_concept: string;
}

export interface QuizState {
  currentIndex: number;
  answers: Record<number, string>;
  revealed: Set<number>;
  completed: boolean;
  showReview: boolean;
}

export type QuizAction =
  | { type: 'ANSWER'; index: number; answer: string }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'COMPLETE' }
  | { type: 'TOGGLE_REVIEW' }
  | { type: 'RESET' };
