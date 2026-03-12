'use client';

import type { QuizQuestion, QuizState } from './quiz-types';

interface QuizCompletionPanelProps {
  questions: QuizQuestion[];
  state: QuizState;
  stats: { correct: number; answered: number; total: number };
  wrongQuestions: number[];
  onToggleReview: () => void;
  onReset: () => void;
}

export function QuizCompletionPanel({
  questions,
  state,
  stats,
  wrongQuestions,
  onToggleReview,
  onReset,
}: QuizCompletionPanelProps) {
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-4 text-center"
        style={{
          background:
            accuracy >= 80
              ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
              : accuracy >= 60
                ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                : 'linear-gradient(135deg, #fee2e2, #fecaca)',
        }}
      >
        <div className="mb-1 text-3xl font-bold">{accuracy}%</div>
        <div className="text-sm text-gray-700">
          答对 {stats.correct} / {stats.total} 题
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {accuracy >= 80 ? '🎉 太棒了！' : accuracy >= 60 ? '👍 继续加油！' : '📚 建议复习后重试'}
        </div>
      </div>

      <div className="flex gap-2">
        {wrongQuestions.length > 0 ? (
          <button
            onClick={onToggleReview}
            className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            📋 错题回顾 ({wrongQuestions.length})
          </button>
        ) : null}
        <button
          onClick={onReset}
          className="flex-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
        >
          🔄 重新答题
        </button>
      </div>

      {state.showReview ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-red-600">错题回顾</div>
          {wrongQuestions.map((questionIndex) => {
            const question = questions[questionIndex];
            return (
              <div key={questionIndex} className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                <div className="mb-1 text-xs text-gray-500">第 {questionIndex + 1} 题</div>
                <div className="mb-2 text-sm font-medium text-gray-800">{question.question}</div>
                <div className="mb-1 text-xs text-red-600">你的答案：{state.answers[questionIndex]}</div>
                <div className="mb-1 text-xs text-green-600">正确答案：{question.answer}</div>
                <div className="mt-2 rounded bg-white p-2 text-xs text-gray-600">💡 {question.explanation}</div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
