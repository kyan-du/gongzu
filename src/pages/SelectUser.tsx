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

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 drop-shadow-sm">你是谁？</h1>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/cyan/home')}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center hover:bg-white/90 transition active:scale-95"
          >
            <div className="text-4xl mb-2">👧</div>
            <div className="text-2xl font-bold text-blue-600">彤彤</div>
          </button>

          <button
            onClick={() => navigate('/ryan/home')}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center hover:bg-white/90 transition active:scale-95"
          >
            <div className="text-4xl mb-2">👦</div>
            <div className="text-2xl font-bold text-green-600">可可</div>
          </button>
        </div>
      </div>
    </div>
  );
}
