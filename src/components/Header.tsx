import { LogOut, ChevronDown, ChevronLeft, Sun, Moon, Monitor, Users, Palette, Check, BookX, BookOpen } from 'lucide-react';
import { getStoredTheme, setStoredTheme } from '../lib/theme';
import { getUserName, getUserAvatar, getAllUsers } from '../lib/users';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../lib/api';

interface HeaderProps {
  userId: string;
  maxWidth?: string;
  showBack?: boolean;
  backTo?: string;
}

// Module → menu item mapping
interface MenuEntry { module: string; label: string; icon: typeof BookX; route: (uid: string) => string; }
const MODULE_MENUS: MenuEntry[] = [
  { module: 'mistakes', label: '错题本', icon: BookX, route: uid => `/${uid}/mistakes` },
  { module: 'vocab',    label: '单词本', icon: BookOpen, route: uid => `/${uid}/vocab` },
];

export default function Header({ userId, maxWidth, showBack, backTo }: HeaderProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user's enabled modules for menu rendering
  useEffect(() => {
    if (!userId || userId === 'parent') return;
    fetch(`/api/modules?userId=${userId}`)
      .then(r => r.json())
      .then((d: any) => {
        const enabled = new Set<string>();
        for (const m of (d.modules || [])) {
          if (m.enabled) enabled.add(m.module);
        }
        setEnabledModules(enabled);
      })
      .catch(() => {});
  }, [userId]);

  // Handle undefined userId - redirect to home
  useEffect(() => {
    if (!userId) {
      navigate('/');
    }
  }, [userId, navigate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // If userId is invalid, don't render anything (will redirect)
  if (!userId) {
    return null;
  }

  const userName = getUserName(userId);
  const avatarSrc = getUserAvatar(userId);
  const allUsers = getAllUsers();

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm">
      <div className={`${maxWidth || 'max-w-3xl'} mx-auto px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-1">
          {showBack && (
            <button
              onClick={() => navigate(backTo || (userId === 'parent' ? '/parent' : `/${userId}/home`))}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="返回"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <button
            onClick={() => navigate(userId === 'parent' ? '/parent' : `/${userId}/home`)}
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
          <img src="/logo-night-64.png" alt="拱卒" className="w-8 h-8 dark:hidden" />
          <img src="/logo-day-64.png" alt="拱卒" className="w-8 h-8 hidden dark:block" />
          <div className="text-left">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">拱卒</span>
            <p className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5">日拱一卒，功不唐捐</p>
          </div>
        </button>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userName}</span>
            <img src={avatarSrc} alt={userName} className="w-8 h-8 rounded-full object-cover" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 py-2 z-50 origin-top-right animate-[dropdown_0.15s_ease-out]">
              <div className="px-4 py-3 flex items-center gap-3">
                <img src={avatarSrc} alt={userName} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{userId}</p>
                </div>
              </div>
              <div className="h-px bg-gray-100 dark:bg-gray-700 mx-3 my-1" />
              {/* Dynamic module menu items */}
              {MODULE_MENUS.filter(m => enabledModules.has(m.module)).map(m => (
                <button
                  key={m.module}
                  onClick={() => { setShowMenu(false); navigate(m.route(userId)); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <m.icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {m.label}
                  </span>
                </button>
              ))}
              {/* Switch user group */}
              <button
                onClick={() => setExpandedSection(expandedSection === 'user' ? null : 'user')}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  切换用户
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform ${expandedSection === 'user' ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {expandedSection === 'user' && (
                <div className="pl-4">
                  {allUsers.filter(u => u.id !== userId).map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setShowMenu(false);
                        setExpandedSection(null);
                        navigate(user.id === 'parent' ? '/parent' : `/${user.id}/home`);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                        {user.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {/* Theme group */}
              <button
                onClick={() => setExpandedSection(expandedSection === 'theme' ? null : 'theme')}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <span className="flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  主题
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform ${expandedSection === 'theme' ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {expandedSection === 'theme' && (
                <div className="pl-4">
                  <button
                    onClick={() => { setTheme('light'); setStoredTheme('light'); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <span className="flex items-center gap-2.5"><Sun className="w-4 h-4" />浅色{theme === 'light' && <Check className="w-3.5 h-3.5 text-blue-500 ml-auto" />}</span>
                  </button>
                  <button
                    onClick={() => { setTheme('dark'); setStoredTheme('dark'); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <span className="flex items-center gap-2.5"><Moon className="w-4 h-4" />深色{theme === 'dark' && <Check className="w-3.5 h-3.5 text-blue-500 ml-auto" />}</span>
                  </button>
                  <button
                    onClick={() => { setTheme('system'); setStoredTheme('system'); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <span className="flex items-center gap-2.5"><Monitor className="w-4 h-4" />自动{theme === 'system' && <Check className="w-3.5 h-3.5 text-blue-500 ml-auto" />}</span>
                  </button>
                </div>
              )}
              <div className="h-px bg-gray-100 dark:bg-gray-700 mx-3 my-1" />
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <span className="flex items-center gap-2.5"><LogOut className="w-4 h-4 text-gray-400 dark:text-gray-500" />退出登录</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
