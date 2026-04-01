import { useParams, useNavigate } from 'react-router-dom';

export default function Result() {
  const { userId } = useParams<{ userId: string; quizId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">结果页（开发中）</p>
        <button
          onClick={() => navigate(`/${userId}/today`)}
          className="mt-4 text-blue-600 hover:underline"
        >
          返回
        </button>
      </div>
    </div>
  );
}
