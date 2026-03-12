import type { QuizQuestion } from './quiz-types';

export const DIFFICULTY_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: '基础', color: '#059669', bg: '#d1fae5' },
  medium: { label: '进阶', color: '#d97706', bg: '#fef3c7' },
  hard: { label: '挑战', color: '#dc2626', bg: '#fee2e2' },
};

export const TYPE_LABELS: Record<string, string> = {
  choice: '选择题',
  true_false: '判断题',
  fill_blank: '填空题',
};

export function parseQuizQuestions(output: string): QuizQuestion[] {
  if (!output) return [];
  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

export function isCorrect(question: QuizQuestion, userAnswer: string): boolean {
  if (!userAnswer) return false;
  const normalizedAnswer = question.answer.trim().toLowerCase();
  const normalizedUser = userAnswer.trim().toLowerCase();

  if (question.type === 'choice') {
    return normalizedAnswer.charAt(0) === normalizedUser.charAt(0);
  }

  return normalizedAnswer === normalizedUser;
}

export function isOptionCorrect(question: QuizQuestion, option: string): boolean {
  return question.answer.trim().toLowerCase().charAt(0) === option.trim().toLowerCase().charAt(0);
}
