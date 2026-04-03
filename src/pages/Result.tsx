import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Result() {
  const { userId } = useParams<{ userId: string; quizId: string }>();
  const navigate = useNavigate();

  return (
    <Layout userId={userId || ''} showBack>
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">结果页（开发中）</p>
          <button
            onClick={() => navigate(`/${userId}/home`)}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            返回
          </button>
        </div>
      </div>
    </Layout>
  );
}
