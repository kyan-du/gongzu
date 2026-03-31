import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { login } from '../lib/api';

export default function Login() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [muted, setMuted] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(passphrase, userId);
      navigate(userId ? `/${userId}` : '/');
    } catch (err: any) {
      setError(err.message || '口令错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleWake = () => {
    if (!showLogin) {
      setShowLogin(true);
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !muted;
    }
    setMuted(!muted);
  };

  const userName = userId === 'cyan' ? '彤彤' : userId === 'ryan' ? '可可' : '';

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden cursor-pointer"
      onClick={handleWake}
    >
      {/* 背景视频 */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster="/bg-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>

      {/* 半透明遮罩 - 登录框出现后加深 */}
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          showLogin ? 'bg-white/40 backdrop-blur-sm' : 'bg-black/10'
        }`}
      />

      {/* 声音按钮 - 右上角 */}
      <button
        onClick={toggleSound}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition"
        aria-label={muted ? '开启声音' : '关闭声音'}
      >
        {muted ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      {/* 未唤醒状态 - 提示文字 */}
      {!showLogin && (
        <div className="relative z-10 text-center animate-pulse">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">拱卒</h1>
          <p className="text-lg text-white/90 drop-shadow-md">轻触屏幕开始</p>
        </div>
      )}

      {/* 登录框 - 点击后淡入 */}
      {showLogin && (
        <div
          className="relative z-10 w-full max-w-md animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
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
                  输入家庭口令
                </label>
                <input
                  id="passphrase"
                  type="password"
                  inputMode="numeric"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90"
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
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-md"
              >
                {loading ? '验证中...' : '进入'}
              </button>
            </form>

            {!userId && (
              <div className="mt-6 pt-6 border-t border-gray-200/60">
                <p className="text-sm text-gray-600 text-center mb-4">快速入口</p>
                <div className="flex gap-3">
                  <a
                    href="/cyan"
                    className="flex-1 text-center py-2 px-4 border-2 border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50/80 transition"
                  >
                    彤彤
                  </a>
                  <a
                    href="/ryan"
                    className="flex-1 text-center py-2 px-4 border-2 border-green-200 text-green-600 rounded-lg hover:bg-green-50/80 transition"
                  >
                    可可
                  </a>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-6 drop-shadow-sm">
            © 2026 拱卒 · 开源项目
          </p>
        </div>
      )}
    </div>
  );
}
