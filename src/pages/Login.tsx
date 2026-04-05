import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, isLoggedIn, setUser } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const path = location.pathname.replace(/^\//, '');
  const userId = (path === 'cyan' || path === 'ryan') ? path : undefined;
  const userName = userId === 'cyan' ? '彤彤' : userId === 'ryan' ? '可可' : '';

  // Already logged in? Skip to home
  useEffect(() => {
    if (isLoggedIn()) {
      if (userId) {
        setUser(userId);
        navigate(`/${userId}/home`, { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(passphrase, userId);
      if (userId) {
        navigate(`/${userId}/home`);
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || '密码错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-dvh flex items-center justify-center p-4 overflow-hidden">
      <video autoPlay muted loop playsInline poster="/bg-poster.jpg" className="absolute inset-0 w-full h-full object-cover">
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2 drop-shadow-sm">拱卒</h1>
          <p className="text-lg text-gray-700 drop-shadow-sm">日拱一卒，功不唐捐</p>
          {userName && (
            <p className="mt-4 text-xl text-gray-800">
              你好，<span className="font-semibold text-blue-600">{userName}</span>
            </p>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 mb-2">
                请输入密码
              </label>
              <input
                id="passphrase"
                type="password"
                inputMode="numeric"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90"
                placeholder="密码"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !passphrase}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-md"
            >
              {loading ? '验证中...' : '进入'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6 drop-shadow-sm">© 2026 拱卒 · 开源项目</p>
      </div>
    </div>
  );
}
