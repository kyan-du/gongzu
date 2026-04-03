import { getTag } from '../lib/tags';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionRenderers, QuestionCard } from '../components/questions';
import Header from '../components/Header';
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
  const [submitting, setSubmitting] = useState(false);
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
    if (!quiz || submitting) return;
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
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
      <Header userId={userId || ''} showBack={false} />

      {/* Quiz tag + date subheader */}
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/${userId}/${date}`)}
            className="p-1 -ml-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="返回"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-2.5 py-0.5 rounded-full">
            {quiz.tag}
          </span>
          {quiz.title && (() => {
            // Remove tag text, question count, and leading/trailing punctuation
            const sub = quiz.title
              .replace(quiz.tag, '')
              .replace(/\s*[·\-]\s*/g, ' ')
              .replace(/\s*\(\d+题\)\s*/, '')
              .trim();
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

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {quiz.questions?.map((q: any, i: number) => {
          const QuestionRenderer = questionRenderers[q.type];
          if (!QuestionRenderer) return null;

          const commonProps = {
            key: `${q.id}-${submitted}`,
            question: q,
            index: i,
            submitted,
            result: getResult(q.id),
          };

          const questionComponent = q.type === 'rewrite' ? (
            <QuestionRenderer
              {...commonProps}
              value={answers[q.id] || ''}
              onChange={(answer: string) => handleAnswer(q.id, answer)}
            />
          ) : (
            <QuestionRenderer
              {...commonProps}
              onAnswer={(answer: string) => handleAnswer(q.id, answer)}
              initialAnswer={answers[q.id]}
            />
          );

          return (
            <QuestionCard key={q.id} index={i + 1}>
              {questionComponent}
            </QuestionCard>
          );
        })}

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition shadow-md mt-6 mb-8 ${
              submitting
                ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
            }`}
          >
            {submitting ? '正在判分…' : `交卷（${answeredCount}/${totalCount}）`}
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
