import { useNavigate } from 'react-router-dom';

export default function SelectUser() {
  const navigate = useNavigate();

  return (
    <div className="relative h-dvh flex items-center justify-center p-4 overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/bg-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 drop-shadow-sm">你是谁？</h1>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/cyan/today')}
            className="flex flex-col items-center bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-5 hover:bg-white/90 transition active:scale-95"
          >
            <img
              src="/avatar-cyan.jpg"
              alt="彤彤"
              className="w-20 h-20 rounded-full object-cover shadow-md mb-3"
            />
            <span className="text-lg font-bold text-blue-600">彤彤</span>
          </button>

          <button
            onClick={() => navigate('/ryan/today')}
            className="flex flex-col items-center bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-5 hover:bg-white/90 transition active:scale-95"
          >
            <img
              src="/avatar-ryan.jpg"
              alt="可可"
              className="w-20 h-20 rounded-full object-cover shadow-md mb-3"
            />
            <span className="text-lg font-bold text-green-600">可可</span>
          </button>

          <button
            onClick={() => navigate('/parent')}
            className="flex flex-col items-center bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-5 hover:bg-white/90 transition active:scale-95"
          >
            <img
              src="/avatar-parent.jpg"
              alt="家长"
              className="w-20 h-20 rounded-full object-cover shadow-md mb-3"
            />
            <span className="text-lg font-bold text-purple-600">家长</span>
          </button>
        </div>
      </div>
    </div>
  );
}
