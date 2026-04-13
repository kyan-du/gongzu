import { useParams, useNavigate } from 'react-router-dom';
import { Grid3X3 } from 'lucide-react';
import Layout from '../components/Layout';

export default function MemorySelect() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/home`} maxWidth="max-w-2xl">
      <div className="flex flex-col items-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          思维训练
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
          选择一种训练开始
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* 套娃记忆 */}
          <button
            onClick={() => navigate(`/${userId}/brain/matryoshka`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 mb-4 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-5xl">🪆</span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                套娃记忆
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                记住卡片的位置和颜色链
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                  序列记忆
                </span>
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                  空间记忆
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* 宫格记忆 */}
          <button
            onClick={() => navigate(`/${userId}/brain/grid`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 mb-4 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-2xl group-hover:scale-110 transition-transform p-2">
                <Grid3X3 className="w-full h-full text-blue-500 dark:text-blue-400" strokeWidth={2} />
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                宫格记忆
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                发现规律并推理填空
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                  规律发现
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                  逻辑推理
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* 宫格推理 */}
          <button
            onClick={() => navigate(`/${userId}/brain/reasoning`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 mb-4 flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-5xl">🧩</span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                宫格推理
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                观察矩阵，推理并填空
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                  规律发现
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                  逻辑推理
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
          {/* 天平排序 */}
          <button
            onClick={() => navigate(`/${userId}/brain/balance`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 mb-4 flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-5xl">⚖️</span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                天平排序
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                观察天平，推理重量排序
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full font-medium">
                  比较推理
                </span>
                <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full font-medium">
                  排序逻辑
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </Layout>
  );
}
