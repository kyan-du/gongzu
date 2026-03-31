import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizzes, submitAnswers, type DailyQuiz, type SubmitAnswer } from '../lib/api';
import ChoiceQuestion from '../components/ChoiceQuestion';
import BlankQuestion from '../components/BlankQuestion';

export default function Quiz() {
  const { userId, quizId } = useParams<{ userId: string; quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const quizzes = await getQuizzes(userId);
      const foundQuiz = quizzes.find((q) => q.id === quizId);
      if (!foundQuiz) {
        throw new Error('Quiz not found');
      }
      setQuiz(foundQuiz);
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        navigate(`/${userId}/login`);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // 检查是否所有题目都已作答
    const unanswered = quiz.questions.filter((q) => {
      const answer = answers[q.id];
      if (q.type === 'choice') {
        return !answer;
      }
      if (q.type === 'blank') {
        return !answer || answer.some((a: string) => !a.trim());
      }
      return false;
    });

    if (unanswered.length > 0) {
      alert(`还有 ${unanswered.length} 题未作答，请完成后再提交`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const submitData: SubmitAnswer[] = quiz.questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id],
      }));

      const result = await submitAnswers(quiz.id, submitData);
      // 跳转到结果页
      navigate(`/${userId}/result/${quiz.id}`, { state: { result, quiz } });
    } catch (err: any) {
      setError(err.message);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">找不到作业</div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter((qid) => {
    const answer = answers[qid];
    if (Array.isArray(answer)) {
      return answer.some((a) => a && a.trim());
    }
    return answer && answer.trim && answer.trim();
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mobile-container flex items-center justify-between py-4">
          <button
            onClick={() => navigate(`/${userId}`)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 返回
          </button>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{quiz.title || quiz.tag}</div>
            <div className="text-xs text-gray-500 mt-1">
              {answeredCount}/{quiz.questions.length}
            </div>
          </div>
          <div className="w-12" />
        </div>
      </div>

      <div className="mobile-container mt-6 space-y-4">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {quiz.questions.map((question, index) => {
          if (question.type === 'choice') {
            return (
              <ChoiceQuestion
                key={question.id}
                question={question}
                index={index}
                value={answers[question.id] || null}
                onChange={(answer) => handleAnswerChange(question.id, answer)}
              />
            );
          }

          if (question.type === 'blank') {
            return (
              <BlankQuestion
                key={question.id}
                question={question}
                index={index}
                value={answers[question.id] || null}
                onChange={(answer) => handleAnswerChange(question.id, answer)}
              />
            );
          }

          return (
            <div key={question.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-sm text-gray-500">
                题型 "{question.type}" 暂未实现
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部提交按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="mobile-container">
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < quiz.questions.length}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {submitting ? '提交中...' : '📤 交卷'}
          </button>
        </div>
      </div>
    </div>
  );
}
