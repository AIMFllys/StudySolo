'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { QuizAction, QuizQuestion } from './quiz-types';
import { DIFFICULTY_BADGES, TYPE_LABELS, isCorrect, isOptionCorrect } from './quiz-utils';

interface QuizQuestionViewProps {
  currentIndex: number;
  fillInput: string;
  isRevealed: boolean;
  question: QuizQuestion;
  questionCount: number;
  stats: { correct: number; answered: number; total: number };
  userAnswer?: string;
  setFillInput: Dispatch<SetStateAction<string>>;
  onAnswer: (answer: string) => void;
  onFillSubmit: () => void;
  onNext: () => void;
  dispatch: Dispatch<QuizAction>;
}

export function QuizQuestionView({
  currentIndex,
  fillInput,
  isRevealed,
  question,
  questionCount,
  stats,
  userAnswer,
  setFillInput,
  onAnswer,
  onFillSubmit,
  onNext,
  dispatch,
}: QuizQuestionViewProps) {
  const diffBadge = DIFFICULTY_BADGES[question.difficulty] ?? DIFFICULTY_BADGES.medium;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((currentIndex + (isRevealed ? 1 : 0)) / questionCount) * 100}%`,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            }}
          />
        </div>
        <span className="whitespace-nowrap text-xs text-gray-500">
          {currentIndex + 1}/{questionCount}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: diffBadge.bg, color: diffBadge.color }}
        >
          {diffBadge.label}
        </span>
        <span className="text-[10px] text-gray-400">{TYPE_LABELS[question.type] ?? question.type}</span>
        {question.source_concept ? <span className="text-[10px] text-gray-400">· {question.source_concept}</span> : null}
      </div>

      <div className="text-sm font-medium text-gray-800">{question.question}</div>

      {question.type === 'fill_blank' ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={fillInput}
            onChange={(event) => setFillInput(event.target.value)}
            disabled={isRevealed}
            onKeyDown={(event) => event.key === 'Enter' && onFillSubmit()}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-50"
            placeholder="输入你的答案..."
          />
          {!isRevealed ? (
            <button
              onClick={onFillSubmit}
              className="rounded-lg bg-indigo-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-600"
            >
              提交
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected = userAnswer === option;
            const isCorrectOption = isRevealed && isOptionCorrect(question, option);
            const isWrongSelection = isRevealed && isSelected && !isCorrectOption;

            let borderColor = '#e5e7eb';
            let backgroundColor = 'white';
            let textColor = '#374151';

            if (isRevealed) {
              if (isCorrectOption) {
                borderColor = '#10b981';
                backgroundColor = '#d1fae5';
                textColor = '#059669';
              } else if (isWrongSelection) {
                borderColor = '#ef4444';
                backgroundColor = '#fee2e2';
                textColor = '#dc2626';
              }
            } else if (isSelected) {
              borderColor = '#6366f1';
              backgroundColor = '#eef2ff';
              textColor = '#4f46e5';
            }

            return (
              <button
                key={index}
                onClick={() => onAnswer(option)}
                disabled={isRevealed}
                className="w-full rounded-lg border px-3 py-2 text-left text-sm transition-all duration-200"
                style={{
                  borderColor,
                  backgroundColor,
                  color: textColor,
                  cursor: isRevealed ? 'default' : 'pointer',
                }}
              >
                <span className="flex items-center gap-2">
                  {isRevealed && isCorrectOption ? <span>✅</span> : null}
                  {isRevealed && isWrongSelection ? <span>❌</span> : null}
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {isRevealed && question.explanation ? (
        <div
          className="rounded-lg p-3 text-xs text-gray-700"
          style={{
            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
            borderLeft: isCorrect(question, userAnswer ?? '') ? '3px solid #10b981' : '3px solid #ef4444',
          }}
        >
          <div className="mb-1 font-semibold text-gray-800">
            {isCorrect(question, userAnswer ?? '') ? '✅ 回答正确！' : `❌ 正确答案：${question.answer}`}
          </div>
          💡 {question.explanation}
        </div>
      ) : null}

      {isRevealed ? (
        <div className="flex justify-between">
          {currentIndex > 0 ? (
            <button
              onClick={() => dispatch({ type: 'PREV' })}
              className="px-3 py-1.5 text-xs text-gray-600 transition-colors hover:text-gray-800"
            >
              ← 上一题
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onNext}
            className="rounded-lg bg-indigo-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-600"
          >
            {currentIndex < questionCount - 1 ? '下一题 →' : '查看结果 🎯'}
          </button>
        </div>
      ) : null}

      {stats.answered > 0 ? (
        <div className="text-center text-[10px] text-gray-400">
          已答 {stats.answered} 题 · 正确 {stats.correct} 题 · 正确率{' '}
          {stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0}%
        </div>
      ) : null}
    </div>
  );
}
