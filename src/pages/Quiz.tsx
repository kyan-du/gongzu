import { getTag } from '../lib/tags';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionRenderers, QuestionCard } from '../components/questions';
import Layout from '../components/Layout';
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
    <Layout userId={userId || ''} showBack maxWidth="max-w-3xl"
      title={quiz?.title || quiz?.tag || tag}
      rightAction={<span className="text-sm text-gray-400 dark:text-gray-500">{date}</span>}
    >


      {/* Passage / reading material */}
      {quiz.passage && (
        <div className="py-4">
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
        <div className="mt-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{score.correct === score.total ? '🎉' : score.correct >= score.total * 0.8 ? '👍' : '💪'}</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{score.correct}/{score.total}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">正确率 {Math.round((score.correct / score.total) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className={quiz.tag === '口算50题' || quiz.tag === '答牛TS口算50题' ? 'py-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5' : 'py-4 space-y-4'}>
        {quiz.questions?.map((q: any, i: number) => {
          const QuestionRenderer = questionRenderers[q.type];
          if (!QuestionRenderer) return null;

          // Compute label for QuestionCard
          let label = '';
          if (q.type === 'choice') {
            label = '单项选择';
          } else if (q.type === 'judgment') {
            label = '判断题';
          } else if (q.type === 'blank') {
            const stem = q.content?.stem || '';
            const blanks = q.content?.blanks || [];
            const hints = blanks.map((b: any) => b?.hint).filter(Boolean);
            const instrMatch = stem.match(/^([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef（）]+)[：:]\s*/);
            if (instrMatch) {
              label = instrMatch[1];
            } else if (hints.length > 0) {
              label = '用所给词的适当形式填空';
            } else if (q.tags?.length > 1) {
              label = q.tags[1];
            }
          } else if (q.type === 'rewrite') {
            label = q.content?.stem || q.content?.instruction || '请改写下列句子';
          } else if (q.type === 'proof') {
            label = '证明/解答题（拍照上传）';
          }

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
          ) : q.type === 'proof' ? (
            <QuestionRenderer
              {...commonProps}
              value={answers[q.id] || ''}
              onChange={(answer: string) => handleAnswer(q.id, answer)}
              userId={userId}
              date={date}
            />
          ) : (
            <QuestionRenderer
              {...commonProps}
              onAnswer={(answer: string) => handleAnswer(q.id, answer)}
              initialAnswer={answers[q.id]}
            />
          );

          return (
            <QuestionCard key={q.id} index={i + 1} label={quiz.tag === '口算50题' || quiz.tag === '答牛TS口算50题' ? '' : label} compact={quiz.tag === '口算50题' || quiz.tag === '答牛TS口算50题'}>
              {questionComponent}
            </QuestionCard>
          );
        })}

        <div className={quiz.tag === '口算50题' || quiz.tag === '答牛TS口算50题' ? 'col-span-2 sm:col-span-4 lg:col-span-5 xl:col-span-6 flex justify-center mt-6 mb-8' : 'flex justify-center mt-6 mb-8'}>
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`py-3 px-10 rounded-full font-semibold text-base transition shadow-sm ${
              submitting
                ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed'
                : 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600'
            }`}
          >
            {submitting ? '正在判分…' : `交卷（${answeredCount}/${totalCount}）`}
          </button>
        ) : (
          <button
            onClick={() => navigate(`/${userId}/${date}`)}
            className="py-3 px-10 rounded-full font-semibold text-base bg-gray-600 dark:bg-gray-500 text-white hover:bg-gray-700 dark:hover:bg-gray-600 transition shadow-sm"
          >
            返回
          </button>
        )}
        </div>
      </div>
    </Layout>
  );
}
