import { useNavigate } from 'react-router-dom';

export default function SelectUser() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
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

        <div className="flex gap-6 justify-center">
          <button
            onClick={() => navigate('/cyan/home')}
            className="flex flex-col items-center bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 hover:bg-white/90 transition active:scale-95 w-36"
          >
            <img
              src="/avatar-cyan.jpg"
              alt="彤彤"
              className="w-24 h-24 rounded-full object-cover shadow-md mb-3"
            />
            <span className="text-xl font-bold text-blue-600">彤彤</span>
          </button>

          <button
            onClick={() => navigate('/ryan/home')}
            className="flex flex-col items-center bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 hover:bg-white/90 transition active:scale-95 w-36"
          >
            <img
              src="/avatar-ryan.jpg"
              alt="可可"
              className="w-24 h-24 rounded-full object-cover shadow-md mb-3"
            />
            <span className="text-xl font-bold text-green-600">可可</span>
          </button>
        </div>
      </div>
    </div>
  );
}
