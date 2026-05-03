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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {/* 套娃记忆 */}
          <button
            onClick={() => navigate(`/${userId}/brain/matryoshka`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-4xl">🪆</span>
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
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-2xl group-hover:scale-110 transition-transform p-2">
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
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-4xl">🧩</span>
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
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-4xl">⚖️</span>
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

          {/* 过河游戏 */}
          <button
            onClick={() => navigate(`/${userId}/brain/river`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/10 dark:to-sky-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-4xl">🚢</span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                过河游戏
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                开船搬运，避开危险组合
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full font-medium">
                  步骤推理
                </span>
                <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full font-medium">
                  动态操作
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>


          {/* 杯子倒水 */}
          <button
            onClick={() => navigate(`/${userId}/brain/water`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-4xl">💧</span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                杯子倒水
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                装满倒空互倒，量出目标水量
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                  状态推理
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                  步骤规划
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

          {/* 灯泡开关 */}
          <button
            onClick={() => navigate(`/${userId}/brain/lights`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-4xl">💡</span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                灯泡开关
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                切换相邻灯泡，全部关灯
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-medium">
                  状态切换
                </span>
                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-medium">
                  逆向推理
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* 天平侦探 */}
          <button
            onClick={() => navigate(`/${userId}/brain/odd-ball`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-4xl">🕵️</span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                天平侦探
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                用天平称重，找出异常重球
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-medium">
                  信息量
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-medium">
                  三分思维
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>





          {/* 不等号棋盘 */}
          <button
            onClick={() => navigate(`/${userId}/brain/futoshiki`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl group-hover:scale-110 transition-transform"><span className="text-4xl">🔢</span></div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">不等号棋盘</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">按大小关系填数，行列不能重复</p>
              <div className="flex items-center gap-2 text-xs"><span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">大小关系</span><span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">排除推理</span></div>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"><div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div></div>
          </button>

          {/* 运算笼 */}
          <button
            onClick={() => navigate(`/${userId}/brain/kenken`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-4xl">🧮</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">运算笼</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">每行每列不重复，小笼子满足四则运算</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full font-medium">四则运算</span>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full font-medium">排除推理</span>
              </div>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"><div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div></div>
          </button>

          {/* 等量代换 */}
          <button
            onClick={() => navigate(`/${userId}/brain/equivalence`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-[0.98] p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 mb-3 flex items-center justify-center bg-teal-100 dark:bg-teal-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                <span className="text-4xl">🔄</span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                等量代换
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                找出等量关系，算出答案
              </p>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full font-medium">
                  等量关系
                </span>
                <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full font-medium">
                  代换推理
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
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
