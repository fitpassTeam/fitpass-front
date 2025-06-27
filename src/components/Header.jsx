import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Button from './Button'; // 커스텀 버튼 컴포넌트
import logo from '../assets/logo.jpg';
import { MdNotifications, MdChat, MdHome } from 'react-icons/md';
import { FaBullseye, FaUserCircle } from 'react-icons/fa';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // localStorage의 token으로 로그인 상태 판단
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      if (token) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('토큰 만료 또는 서버 오류');
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setIsLoggedIn(false);
          window.location.href = '/login';
        }
      }
    };
    checkLogin();
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    window.location.href = '/'; // 강제 새로고침으로 토큰 무효화
  };

  const navItems = isLoggedIn
    ? [
        { id: 'home', label: <><MdHome className="inline mb-1 mr-1 text-blue-500" />홈</>, to: '/home' },
        { id: 'chat', label: <><MdChat className="inline mb-1 mr-1 text-blue-500" />채팅</>, to: '#', onClick: () => alert('채팅 기능은 추후 추가 예정입니다.') },
        { id: 'notification', label: <><MdNotifications className="inline mb-1 mr-1 text-pink-500" />알림</>, to: '#', onClick: () => alert('알림 기능은 추후 추가 예정입니다.') },
        { id: 'mygoal', label: <><FaBullseye className="inline mb-1 mr-1 text-purple-500" />나의 목표</>, to: '/my-goal' },
        { id: 'mypage', label: <><FaUserCircle className="inline mb-1 mr-1 text-gray-500" />마이페이지</>, to: '/mypage' },
      ]
    : [
        { id: 'home', label: <><MdHome className="inline mb-1 mr-1 text-blue-500" />홈</>, to: '/home' },
        { id: 'login', label: '로그인', to: '/login' },
      ];

  const actionButton = isLoggedIn
    ? { label: '로그아웃', onClick: handleLogout }
    : { label: '회원가입', to: '/signup' };

  return (
    <header className="sticky top-0 bg-white px-4 z-30 shadow-md">
      <div className="container mx-auto flex justify-between items-center h-16">
        <Link to="/" className="flex items-center space-x-2 select-none">
          <img src={logo} alt="fitpass logo" className="h-10 w-auto rounded-full shadow" />
          <span className="text-2xl font-extrabold tracking-tight text-black drop-shadow">FITPASS</span>
        </Link>
        <div className="flex items-center space-x-6">
          <nav className="flex space-x-2 items-center">
            {navItems.map(item => (
              item.id === 'notification' || item.id === 'chat' ? (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-base font-semibold text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition focus:outline-none"
                  aria-label={item.id === 'notification' ? '알림' : '채팅'}
                >
                  {item.label}
                </button>
              ) : (
                <NavLink
                  key={item.id}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1 px-3 py-2 rounded-lg text-base font-semibold transition font-sans ` +
                    (item.id === 'home'
                      ? 'text-gray-700 hover:bg-blue-100 hover:text-blue-600'
                      : (isActive
                          ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white shadow'
                          : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600'))
                  }
                >
                  {item.label}
                </NavLink>
              )
            ))}
          </nav>
          {isLoggedIn ? (
            <Button onClick={handleLogout} className="ml-2 bg-gray-200 text-black font-semibold px-4 py-2 rounded-lg shadow hover:bg-gray-300 transition">
              로그아웃
            </Button>
          ) : (
            <Button
              onClick={() => navigate(actionButton.to)}
              className="ml-2 bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-pink-500 transition"
            >
              {actionButton.label}
            </Button>
          )}
        </div>
      </div>
      {/* 응원 문구 */}
      <div className="flex justify-center mt-2 mb-2">
        <span className="text-xl sm:text-2xl font-bold font-[cursive] bg-gradient-to-r from-blue-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-fadeInOut drop-shadow">
          오늘도 힘내! 너의 운동을 응원해!
        </span>
      </div>
    </header>
  );
}