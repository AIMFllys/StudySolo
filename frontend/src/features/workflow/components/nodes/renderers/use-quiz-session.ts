'use client';

import { useCallback, useMemo, useReducer, useState } from 'react';
import type { QuizAction, QuizQuestion, QuizState } from './quiz-types';
import { isCorrect } from './quiz-utils';

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.index]: action.answer },
        revealed: new Set([...state.revealed, action.index]),
      };
    case 'NEXT':
      return { ...state, currentIndex: state.currentIndex + 1 };
    case 'PREV':
      return { ...state, currentIndex: Math.max(0, state.currentIndex - 1) };
    case 'COMPLETE':
      return { ...state, completed: true };
    case 'TOGGLE_REVIEW':
      return { ...state, showReview: !state.showReview };
    case 'RESET':
      return {
        currentIndex: 0,
        answers: {},
        revealed: new Set(),
        completed: false,
        showReview: false,
      };
    default:
      return state;
  }
}

const initialState: QuizState = {
  currentIndex: 0,
  answers: {},
  revealed: new Set<number>(),
  completed: false,
  showReview: false,
};

export function useQuizSession(questions: QuizQuestion[]) {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const [fillInput, setFillInput] = useState('');

  const stats = useMemo(() => {
    let correct = 0;
    let answered = 0;
    for (const [index, userAnswer] of Object.entries(state.answers)) {
      answered += 1;
      const question = questions[Number(index)];
      if (question && isCorrect(question, userAnswer)) {
        correct += 1;
      }
    }
    return { correct, answered, total: questions.length };
  }, [questions, state.answers]);

  const wrongQuestions = useMemo(() => {
    return Object.entries(state.answers)
      .filter(([index, userAnswer]) => {
        const question = questions[Number(index)];
        return question && !isCorrect(question, userAnswer);
      })
      .map(([index]) => Number(index));
  }, [questions, state.answers]);

  const handleAnswer = useCallback((answer: string) => {
    if (state.revealed.has(state.currentIndex)) return;
    dispatch({ type: 'ANSWER', index: state.currentIndex, answer });
  }, [state.currentIndex, state.revealed]);

  const handleFillSubmit = useCallback(() => {
    if (!fillInput.trim()) return;
    handleAnswer(fillInput.trim());
    setFillInput('');
  }, [fillInput, handleAnswer]);

  const handleNext = useCallback(() => {
    if (state.currentIndex < questions.length - 1) {
      dispatch({ type: 'NEXT' });
      return;
    }
    dispatch({ type: 'COMPLETE' });
  }, [questions.length, state.currentIndex]);

  return {
    state,
    stats,
    wrongQuestions,
    fillInput,
    setFillInput,
    dispatch,
    currentQuestion: questions[state.currentIndex],
    isRevealed: state.revealed.has(state.currentIndex),
    userAnswer: state.answers[state.currentIndex],
    handleAnswer,
    handleFillSubmit,
    handleNext,
  };
}
