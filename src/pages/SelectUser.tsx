import { useNavigate } from 'react-router-dom';
import { getAllUsers } from '../lib/users';

const colorClasses = ['text-blue-600', 'text-green-600', 'text-purple-600'];

export default function SelectUser() {
  const navigate = useNavigate();
  const users = getAllUsers();

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
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => navigate(user.id === 'parent' ? '/parent' : `/${user.id}/home`)}
              className="flex flex-col items-center bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-5 hover:bg-white/90 transition active:scale-95"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover shadow-md mb-3"
              />
              <span className={`text-lg font-bold ${colorClasses[index % colorClasses.length]}`}>
                {user.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
