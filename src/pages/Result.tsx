import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { type DailyQuiz, type SubmitResult } from '../lib/api';

export default function Result() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { result, quiz } = location.state as {
    result: { score: number; total: number; percentage: number; results: SubmitResult[] };
    quiz: DailyQuiz;
  };

  if (!result || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">未找到结果数据</div>
      </div>
    );
  }

  // 建立题目映射
  const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="mobile-container flex items-center justify-between py-4">
          <div className="font-semibold text-gray-900">📊 {quiz.title || quiz.tag}</div>
          <button
            onClick={() => navigate(`/${userId}`)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            返回首页
          </button>
        </div>
      </div>

      <div className="mobile-container">
        {/* 得分展示 */}
        <div className="mt-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white text-center">
          <div className="text-5xl font-bold mb-2">
            🎉 {result.score}/{result.total}
          </div>
          <div className="text-xl opacity-90">正确率 {result.percentage}%</div>
          <div className="mt-4 text-sm opacity-75">{quiz.date}</div>
        </div>

        {/* 逐题结果 */}
        <div className="mt-6 space-y-4">
          <div className="text-lg font-semibold text-gray-900">详细结果</div>

          {result.results.map((r, index) => {
            const question = questionMap.get(r.questionId);
            if (!question) return null;

            const isCorrect = r.correct;
            const content = question.content;

            return (
              <div
                key={r.questionId}
                className={`bg-white rounded-xl p-6 border-l-4 ${
                  isCorrect ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`text-2xl ${
                      isCorrect ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {isCorrect ? '✅' : '❌'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">第 {index + 1} 题</div>
                    <div className="text-gray-900 whitespace-pre-wrap">{content.stem}</div>
                  </div>
                </div>

                {!isCorrect && (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">正确答案: </span>
                      <span className="font-medium text-green-600">
                        {Array.isArray(r.correctAnswer)
                          ? r.correctAnswer.join(', ')
                          : r.correctAnswer}
                      </span>
                    </div>
                    {r.explanation && (
                      <div className="bg-blue-50 rounded-lg p-3 text-sm">
                        <div className="text-blue-700 font-medium mb-1">💡 解析</div>
                        <div className="text-gray-700">{r.explanation}</div>
                      </div>
                    )}
                    {r.feedback && (
                      <div className="text-xs text-gray-500 italic">{r.feedback}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部操作 */}
        <div className="mt-8 mb-8 flex gap-3">
          <button
            onClick={() => navigate(`/${userId}`)}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            🏠 返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
