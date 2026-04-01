import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChoiceQuestion from '../components/ChoiceQuestion';
import BlankQuestion from '../components/BlankQuestion';

export default function Quiz() {
  const { userId, date, tag } = useParams<{ userId: string; date: string; tag: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/quiz?userId=${userId}&date=${date}`);
        const data = await res.json();
        const found = data.quizzes?.find((q: any) => q.tag === decodeURIComponent(tag || ''));
        setQuiz(found || null);
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
      setResults(data.results || []);
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
    return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>;
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">找不到这份作业</p>
          <button onClick={() => navigate(`/${userId}/home`)} className="mt-4 text-blue-600 hover:underline">返回首页</button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalCount = quiz.questions?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate(`/${userId}/home`)} className="text-blue-600 font-medium">
          ← 返回
        </button>
        <span className="font-bold text-gray-900">{quiz.tag}</span>
        <span className="text-sm text-gray-500">{answeredCount}/{totalCount}</span>
      </div>

      {submitted && (
        <div className="bg-white mx-4 mt-4 rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl font-bold mb-2">
            {score.correct === score.total ? '🎉' : score.correct >= score.total * 0.8 ? '👍' : '💪'}
          </div>
          <div className="text-3xl font-bold text-gray-900">{score.correct} / {score.total}</div>
          <div className="text-sm text-gray-500 mt-1">正确率 {Math.round((score.correct / score.total) * 100)}%</div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-4">
        {quiz.questions?.map((q: any, i: number) => {
          if (q.type === 'choice') {
            return (
              <ChoiceQuestion
                key={q.id}
                question={q}
                index={i}
                onAnswer={(answer: string) => handleAnswer(q.id, answer)}
                submitted={submitted}
                result={getResult(q.id)}
              />
            );
          }
          if (q.type === 'blank') {
            return (
              <BlankQuestion
                key={q.id}
                question={q}
                index={i}
                onAnswer={(answer: string) => handleAnswer(q.id, answer)}
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
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-md mt-6 mb-8"
          >
            📤 交卷（{answeredCount}/{totalCount}）
          </button>
        ) : (
          <button
            onClick={() => navigate(`/${userId}/home`)}
            className="w-full bg-gray-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-gray-700 transition shadow-md mt-6 mb-8"
          >
            🏠 返回首页
          </button>
        )}
      </div>
    </div>
  );
}
