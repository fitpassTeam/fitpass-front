import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Button from './Button'; // 커스텀 버튼 컴포넌트
import logo from '../assets/logo.jpg';
import { MdNotifications, MdChat, MdHome } from 'react-icons/md';
import { FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';
import useSseSubscribe from '../hooks/useSseSubscribe';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const navigate = useNavigate();
  const { notifications, addNotification, unreadCount, markAsRead } = useNotification();

  // SSE 알림 구독
  useSseSubscribe((notification) => {
    addNotification(notification);
  });

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
        { id: 'chat', label: <><MdChat className="inline mb-1 mr-1 text-blue-500" />채팅</>, to: '#', onClick: () => {
          if (!isLoggedIn) { alert('로그인한 유저만 이용 가능합니다.'); return; }
          alert('채팅 기능은 추후 추가 예정입니다.');
        } },
        { id: 'notification', label: <><MdNotifications className="inline mb-1 mr-1 text-pink-500" />알림</>, to: '#', onClick: () => {
          if (!isLoggedIn) { alert('로그인한 유저만 이용 가능합니다.'); return; }
          setShowNotification((v) => !v);
        } },
        { id: 'mypage', label: <><FaUserCircle className="inline mb-1 mr-1 text-gray-500" />마이페이지</>, to: '/mypage', onClick: () => {
          if (!isLoggedIn) { alert('로그인한 유저만 이용 가능합니다.'); return; }
          navigate('/mypage');
        } },
      ]
    : [
        { id: 'home', label: <><MdHome className="inline mb-1 mr-1 text-blue-500" />홈</>, to: '/home' },
        { id: 'login', label: '로그인', to: '/login' },
        { id: 'signup', label: '회원가입', to: '/signup' },
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
        {/* 햄버거 메뉴(모바일) */}
        <button
          className="sm:hidden p-2 ml-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴 열기"
        >
          {menuOpen ? <FaTimes size={28} /> : <FaBars size={28} />}
        </button>
        {/* PC: 기존 메뉴 */}
        <div className="hidden sm:flex items-center space-x-6 relative">
          <nav className="flex space-x-2 items-center">
            {navItems.map(item => (
              item.id === 'notification' ? (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-base font-semibold text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition focus:outline-none relative"
                  aria-label="알림"
                >
                  {item.label}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold shadow">{unreadCount}</span>
                  )}
                </button>
              ) : item.id === 'chat' ? (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-base font-semibold text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition focus:outline-none"
                  aria-label="채팅"
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
          {/* 알림 드롭다운 */}
          {showNotification && (
            <div className="fixed inset-0 z-40" onClick={() => setShowNotification(false)}>
              <div
                className="absolute right-4 top-20 w-96 max-w-full bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-pink-200 animate-fadeIn"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="font-bold text-lg text-pink-600 flex items-center gap-2">
                    <MdNotifications className="text-pink-400" /> 알림
                  </span>
                  <button className="text-gray-400 hover:text-pink-400" onClick={() => setShowNotification(false)}>
                    <FaTimes size={20} />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <MdNotifications size={48} className="mb-2" />
                      <div>알림이 없습니다.</div>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id || n.createdAt}
                        className={`group p-4 mb-2 rounded-xl shadow-sm border transition-all cursor-pointer
                          ${n.read ? 'bg-gray-50 border-gray-100' : 'bg-pink-50 border-pink-200'}
                          hover:bg-pink-100 hover:shadow-md`}
                      >
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          <MdNotifications className="text-pink-400" />
                          {n.content || n.message || '새 알림이 도착했습니다.'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                        <div className="flex gap-2 mt-2">
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="text-xs text-blue-500 underline hover:text-pink-500"
                            >
                              읽음
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 모바일: 드롭다운 메뉴 */}
      {menuOpen && (
        <div className="sm:hidden w-full bg-white shadow-md rounded-b-2xl animate-fadeIn flex flex-col items-center py-4 gap-2 z-40">
          <nav className="flex flex-col w-full items-center gap-2">
            {navItems.map(item => (
              item.id === 'notification' || item.id === 'chat' ? (
                <button
                  key={item.id}
                  onClick={() => { setMenuOpen(false); item.onClick && item.onClick(); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition w-11/12"
                  aria-label={item.id === 'notification' ? '알림' : '채팅'}
                >
                  {item.label}
                </button>
              ) : (
                <NavLink
                  key={item.id}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold transition font-sans w-11/12 ` +
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
            <Button onClick={() => { setMenuOpen(false); handleLogout(); }} className="w-11/12 mt-2 bg-gray-200 text-black font-semibold px-4 py-3 rounded-lg shadow hover:bg-gray-300 transition">
              로그아웃
            </Button>
          ) : (
            <Button
              onClick={() => { setMenuOpen(false); navigate(actionButton.to); }}
              className="w-11/12 mt-2 bg-blue-500 text-white font-semibold px-4 py-3 rounded-lg shadow hover:bg-pink-500 transition"
            >
              {actionButton.label}
            </Button>
          )}
        </div>
      )}
      {/* 응원 문구 */}
      <div className="flex justify-center mt-2 mb-2">
        <span className="text-xl sm:text-2xl font-bold text-center">
          헬스도, <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#7c3aed' }}>PT</span>도,<br />
          한 번에 <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#ec4899', fontSize: '1.35em', letterSpacing: '0.04em' }}>Fitpass</span>.
        </span>
      </div>
    </header>
  );
}