import { getTag } from '../lib/tags';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChoiceQuestion from '../components/ChoiceQuestion';
import BlankQuestion from '../components/BlankQuestion';
import ReadingQuestion from '../components/ReadingQuestion';
import RewriteQuestion from '../components/RewriteQuestion';
import RichPassage from '../components/RichPassage';
import type { Quiz as QuizType, SubmissionResult } from '../lib/types';
import { normalizeQuiz, normalizeSubmissionResults } from '../lib/types';

export default function Quiz() {
  const { userId, date, tag } = useParams<{ userId: string; date: string; tag: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<SubmissionResult[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/quiz?userId=${userId}&date=${date}`);
        const data = await res.json();
        const found = data.quizzes?.find((q: any) => q.tag === getTag(tag || ''));
        if (!found) {
          setQuiz(null);
          setLoading(false);
          return;
        }
        const normalized = normalizeQuiz(found);
        setQuiz(normalized);

        // Check if already submitted — restore answers and results
        const subRes = await fetch(`/api/submit?userId=${userId}&quizId=${normalized.id}`);
        const subData = await subRes.json();
        if (subData.submitted) {
          const normalizedResults = normalizeSubmissionResults(subData.results || []);
          setResults(normalizedResults);
          setScore({ correct: subData.correct || 0, total: subData.total || 0 });
          const restoredAnswers: Record<string, string> = {};
          for (const r of normalizedResults) {
            restoredAnswers[r.questionId] = r.answer;
          }
          setAnswers(restoredAnswers);
          setSubmitted(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [userId, date, tag]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    try {
      const answerList = quiz.questions.map((q: any) => ({
        questionId: q.id,
        answer: answers[q.id] || '',
      }));

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, quizId: quiz.id, answers: answerList }),
      });

      const data = await res.json();
      setResults(normalizeSubmissionResults(data.results || []));
      setScore({ correct: data.score || 0, total: data.total || 0 });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error(e);
      alert('提交失败，请重试');
    }
  };

  const getResult = (questionId: string) => {
    return results.find((r) => r.questionId === questionId);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 dark:text-gray-500 dark:bg-gray-900">加载中...</div>;
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">找不到这份作业</p>
          <button onClick={() => navigate(`/${userId}/${date}`)} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline">返回</button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalCount = quiz.questions?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/${userId}/${date}`)} className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button onClick={() => navigate(`/${userId}/home`)} className="hover:opacity-80 transition">
              <img src="/logo-night-64.png" alt="拱卒" className="w-7 h-7 rounded-full object-cover dark:hidden" />
              <img src="/logo-day-64.png" alt="拱卒" className="w-7 h-7 rounded-full object-cover hidden dark:block" />
            </button>
            <div className="text-left">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">拱卒</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5">日拱一卒，功不唐捐</p>
            </div>
          </div>
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">已答 {answeredCount}/{totalCount}</span>
        </div>
      </div>

      {/* Quiz tag + date subheader */}
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-2.5 py-0.5 rounded-full">
            {quiz.tag}
          </span>
          {quiz.title && quiz.title !== quiz.tag && (() => {
            const sub = quiz.title.replace(quiz.tag, '').replace(/\s*\(\d+题\)\s*/, '').replace(/^[·\s]+|[·\s]+$/g, '');
            return sub ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">{sub}</span>
            ) : null;
          })()}
        </div>
        <span className="text-sm text-gray-400 dark:text-gray-500">{date}</span>
      </div>

      {/* Passage / reading material */}
      {quiz.passage && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">📖</span>
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">阅读材料</span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <RichPassage passage={quiz.passage} />
            </div>
          </div>
        </div>
      )}

      {submitted && (
        <div className="max-w-2xl mx-auto px-4 mt-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{score.correct === score.total ? '🎉' : score.correct >= score.total * 0.8 ? '👍' : '💪'}</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{score.correct}/{score.total}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">正确率 {Math.round((score.correct / score.total) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-4">
        {quiz.questions?.map((q: any, i: number) => {
          if (q.type === 'choice') {
            return (
              <ChoiceQuestion
                key={`${q.id}-${submitted}`}
                question={q}
                index={i}
                onAnswer={(answer: string) => handleAnswer(q.id, answer)}
                submitted={submitted}
                result={getResult(q.id)}
                initialAnswer={answers[q.id]}
              />
            );
          }
          if (q.type === 'blank') {
            return (
              <BlankQuestion
                key={`${q.id}-${submitted}`}
                question={q}
                index={i}
                onAnswer={(answer: string) => handleAnswer(q.id, answer)}
                submitted={submitted}
                result={getResult(q.id)}
                initialAnswer={answers[q.id]}
              />
            );
          }
          if (q.type === 'reading') {
            return (
              <ReadingQuestion
                key={`${q.id}-${submitted}`}
                question={q}
                index={i}
                onAnswer={(answer: string) => handleAnswer(q.id, answer)}
                submitted={submitted}
                result={getResult(q.id)}
                initialAnswer={answers[q.id]}
              />
            );
          }
          if (q.type === 'rewrite') {
            return (
              <RewriteQuestion
                key={`${q.id}-${submitted}`}
                question={q}
                index={i}
                value={answers[q.id] || ''}
                onChange={(answer: string) => handleAnswer(q.id, answer)}
                submitted={submitted}
                result={getResult(q.id)}
              />
            );
          }
          return null;
        })}

        {!submitted ? (
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition shadow-md mt-6 mb-8"
          >
            交卷（{answeredCount}/{totalCount}）
          </button>
        ) : (
          <button
            onClick={() => navigate(`/${userId}/${date}`)}
            className="w-full bg-gray-600 dark:bg-gray-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition shadow-md mt-6 mb-8"
          >
            返回
          </button>
        )}
      </div>
    </div>
  );
}
