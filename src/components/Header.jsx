import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Button from './Button'; // 커스텀 버튼 컴포넌트
import logo from '../assets/logo.jpg';
import { FaBell, FaComments } from 'react-icons/fa';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // localStorage의 token으로 로그인 상태 판단
  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
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
        { id: 'home', label: 'Home', to: '/home' },
        { id: 'chat', label: <FaComments />, to: '#', onClick: () => alert('채팅 기능은 추후 추가 예정입니다.') },
        { id: 'notification', label: <FaBell />, to: '#', onClick: () => alert('알림 기능은 추후 추가 예정입니다.') },
        { id: 'mygoal', label: 'MyGoal', to: '/my-goal' },
        { id: 'mypage', label: 'MyPage', to: '/mypage' },
      ]
    : [
        { id: 'home', label: 'Home', to: '/home' },
        { id: 'login', label: 'Login', to: '/login' },
      ];

  const actionButton = isLoggedIn
    ? { label: '로그아웃', onClick: handleLogout }
    : { label: 'Sign Up', to: '/signup' };

  return (
    <header className="sticky top-0 bg-white px-4 z-30">
      <div className="container mx-auto flex justify-between items-center h-14">
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-black">
          <img src={logo} alt="fitpass logo" className="h-10 w-auto" />
          <span>FITPASS</span>
        </Link>
        <div className="flex items-center space-x-6">
          <nav className="flex space-x-6 items-center">
            {navItems.map(item => (
              item.id === 'notification' || item.id === 'chat' ? (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="text-black hover:text-blue-500 text-lg focus:outline-none"
                  aria-label={item.id === 'notification' ? '알림' : '채팅'}
                >
                  {item.label}
                </button>
              ) : (
                <NavLink
                  key={item.id}
                  to={item.to}
                  className="text-black hover:text-gray-600 text-lg font-semibold"
                >
                  {item.label}
                </NavLink>
              )
            ))}
          </nav>
          {isLoggedIn ? (
            <Button onClick={handleLogout} className="ml-2 bg-gray-200 text-black">
              로그아웃
            </Button>
          ) : (
            <Button
              onClick={() => navigate(actionButton.to)}
              className={
                actionButton.label === 'Sign Up'
                  ? 'ml-2 bg-blue-500 text-white'
                  : 'ml-2 bg-gray-200 text-black'
              }
            >
              {actionButton.label}
            </Button>
          )}
        </div>
      </div>
      {/* 응원 문구 */}
      <div className="flex justify-center mt-2 mb-2">
        <span className="text-xl sm:text-2xl font-bold font-[cursive] bg-gradient-to-r from-blue-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-fadeInOut">
          오늘도 힘내! 너의 운동을 응원해!
        </span>
      </div>
    </header>
  );
}