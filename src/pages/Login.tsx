import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { login } from '../lib/api';

export default function Login() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(passphrase, userId);
      // 登录成功，跳转到首页
      navigate(userId ? `/${userId}` : '/');
    } catch (err: any) {
      setError(err.message || '口令错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const userName = userId === 'cyan' ? '彤彤' : userId === 'ryan' ? '可可' : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">拱卒</h1>
          <p className="text-gray-600">日拱一卒，功不唐捐</p>
          {userName && (
            <p className="mt-4 text-xl text-gray-800">
              你好，<span className="font-semibold text-blue-600">{userName}</span>
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 mb-2">
                输入家庭口令
              </label>
              <input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入口令"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passphrase}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {loading ? '验证中...' : '进入'}
            </button>
          </form>

          {!userId && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center mb-4">快速入口</p>
              <div className="flex gap-3">
                <a
                  href="/cyan"
                  className="flex-1 text-center py-2 px-4 border-2 border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  彤彤
                </a>
                <a
                  href="/ryan"
                  className="flex-1 text-center py-2 px-4 border-2 border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition"
                >
                  可可
                </a>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2026 拱卒 · 开源项目
        </p>
      </div>
    </div>
  );
}
