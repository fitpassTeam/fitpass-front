import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Button from './Button'; // 커스텀 버튼 컴포넌트
import logo from '../assets/logo.jpg';
import { MdNotifications, MdChat, MdHome } from 'react-icons/md';
import { FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';
import useSseSubscribe from '../hooks/useSseSubscribe';
import { api } from '../api/http';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showChatRooms, setShowChatRooms] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [chatRoomNames, setChatRoomNames] = useState({});
  const [chatRoomImages, setChatRoomImages] = useState({});
  const navigate = useNavigate();
  const { notifications, addNotification, unreadCount, markAsRead } = useNotification();

  // SSE 알림 구독
  useSseSubscribe((notification) => {
    addNotification(notification);
  });

  // 토큰이 바뀔 때마다 userInfo를 새로 불러오게 (storage 이벤트 + polling)
  useEffect(() => {
    const fetchUser = () => {
      const token = localStorage.getItem('token');
      if (token) {
        api.get('/users/me').then(res => setUserInfo(res.data?.data)).catch(() => setUserInfo(null));
      } else {
        setUserInfo(null);
      }
    };
    fetchUser(); // 최초 1회만 호출
    window.addEventListener('storage', fetchUser);
    return () => {
      window.removeEventListener('storage', fetchUser);
    };
  }, []);

  useEffect(() => {
    if (!showChatRooms || !chatRooms.length || !userInfo) return;
    if (userInfo.userRole === 'USER' || userInfo.userRole === 'PENDING_OWNER') {
      const fetchNamesAndImages = async () => {
        const names = {};
        const images = {};
        await Promise.all(chatRooms.map(async (room) => {
          try {
            const res = await api.get(`/gyms/${room.gymId}`);
            const gym = res.data?.data || {};
            names[room.chatRoomId] = gym.name || '체육관';
            images[room.chatRoomId] = gym.profileImage || gym.avatar || gym.imageUrl || (Array.isArray(gym.images) ? gym.images[0] : null) || '';
          } catch {
            names[room.chatRoomId] = '체육관';
            images[room.chatRoomId] = '';
          }
        }));
        setChatRoomNames(names);
        setChatRoomImages(images);
      };
      fetchNamesAndImages();
    } else if (userInfo.userRole === 'OWNER') {
      const fetchNamesAndImages = async () => {
        const names = {};
        const images = {};
        await Promise.all(chatRooms.map(async (room) => {
          try {
            const res = await api.get(`/users/${room.userId}`);
            const user = res.data?.data || {};
            names[room.chatRoomId] = user.name || user.nickname || '유저';
            images[room.chatRoomId] = user.userImage || user.profileImage || user.avatar || user.imageUrl || (Array.isArray(user.images) ? user.images[0] : null) || '';
          } catch {
            names[room.chatRoomId] = '유저';
            images[room.chatRoomId] = '';
          }
        }));
        setChatRoomNames(names);
        setChatRoomImages(images);
      };
      fetchNamesAndImages();
    }
  }, [showChatRooms, chatRooms, userInfo]);

  // userInfo가 바뀔 때마다 채팅방 목록 미리 불러오기
  useEffect(() => {
    if (!userInfo) return;
    const fetchChatRooms = async () => {
      if (userInfo.userRole === 'OWNER') {
        const myGymsRes = await api.get('/users/me/gyms');
        const myGyms = Array.isArray(myGymsRes.data?.data) ? myGymsRes.data.data : [];
        let allRooms = [];
        for (const gym of myGyms) {
          const gymId = gym.id || gym.gymId || gym._id;
          const res = await api.get(`/ws/chatRooms?userId=${gymId}&userType=OWNER`);
          allRooms = allRooms.concat(res.data.data || []);
        }
        setChatRooms(allRooms);
      } else {
        let requestUserId = userInfo.userId ?? userInfo.id;
        if (requestUserId) {
          const res = await api.get(`/ws/chatRooms?userId=${requestUserId}&userType=${userInfo.userRole}`);
          setChatRooms(res.data.data || []);
        }
      }
    };
    fetchChatRooms();
    // 알림도 마찬가지로 미리 불러오려면 여기에 fetchNotifications() 추가

    // 읽음 처리 후 채팅방 목록 새로고침 이벤트 리스너
    const refresh = () => { fetchChatRooms(); };
    window.addEventListener('refreshChatRooms', refresh);
    return () => window.removeEventListener('refreshChatRooms', refresh);
  }, [userInfo]);

  const handleLogin = () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/users/me').then(res => setUserInfo(res.data?.data)).catch(() => setUserInfo(null));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUserInfo(null);
    window.location.href = '/';
  };

  const handleChatClick = async () => {
    console.log('userInfo:', userInfo);
    console.log('userInfo.id:', userInfo && userInfo.id);
    console.log('userInfo.userId:', userInfo && userInfo.userId);
    if (!userInfo) {
      alert('유저 정보를 불러오는 중입니다.');
      return;
    }
    try {
      if (userInfo.userRole === 'OWNER') {
        // 오너의 경우 모든 체육관 id로 각각 채팅방 목록을 조회해서 합침
        try {
          const myGymsRes = await api.get('/users/me/gyms');
          const myGyms = Array.isArray(myGymsRes.data?.data) ? myGymsRes.data.data : [];
          if (myGyms.length > 0) {
            let allRooms = [];
            for (const gym of myGyms) {
              const gymId = gym.id || gym.gymId || gym._id;
              const res = await api.get(`/ws/chatRooms?userId=${gymId}&userType=OWNER`);
              allRooms = allRooms.concat(res.data.data || []);
            }
            setChatRooms(allRooms);
            setShowChatRooms(true);
          } else {
            alert('등록된 체육관이 없습니다.');
            return;
          }
        } catch (error) {
          alert('내 체육관 정보를 불러오지 못했습니다.');
          return;
        }
      } else {
        // 일반 유저/트레이너는 기존 방식대로
        let requestUserId = userInfo.userId ?? userInfo.id;
        if (!requestUserId) {
          alert('채팅방을 조회할 수 없습니다. (유저 정보 없음)');
          return;
        }
        console.log('채팅방 목록 조회 - userId:', requestUserId, 'userType:', userInfo.userRole);
        const res = await api.get(`/ws/chatRooms?userId=${requestUserId}&userType=${userInfo.userRole}`);
        setChatRooms(res.data.data || []);
        setShowChatRooms(true);
      }
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error);
      alert('채팅방 목록을 불러오지 못했습니다.');
    }
  };

  const handleChatRoomClick = (chatRoomId) => {
    setShowChatRooms(false);
    navigate(`/chat/${chatRoomId}`);
  };

  // userInfo만 있으면 로그인 상태로 간주
  const isReallyLoggedIn = !!userInfo;

  // 전체 안읽은 메시지 수 계산
  const totalUnreadChats = chatRooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);

  // navItems에서 채팅 아이콘에 뱃지 추가
  const navItems = isReallyLoggedIn
    ? [
        { id: 'home', label: <span className="flex items-center gap-1 text-lg"><MdHome className="align-middle relative" style={{ top: '-2px', fontSize: '1.25em' }} />홈</span>, to: '/home' },
        { id: 'chat', label: <span className="flex items-center gap-1 text-lg"><MdChat className="align-middle relative" style={{ top: '-2px', fontSize: '1.25em' }} />채팅{totalUnreadChats > 0 && <span className="ml-1 bg-pink-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold shadow">{totalUnreadChats}</span>}</span>, to: '#', onClick: handleChatClick },
        { id: 'notification', label: <span className="flex items-center gap-1 text-lg"><MdNotifications className="align-middle relative" style={{ top: '-2px', fontSize: '1.25em' }} />알림</span>, to: '#', onClick: () => { setShowNotification((v) => !v); } },
        { id: 'mypage', label: <span className="flex items-center gap-1 text-lg"><FaUserCircle className="align-middle relative" style={{ top: '-2px', fontSize: '1.25em' }} />마이페이지</span>, to: '/mypage', onClick: () => { navigate('/mypage'); } },
      ]
    : [
        { id: 'home', label: <span className="flex items-center gap-1 text-lg"><MdHome className="align-middle relative" style={{ top: '-2px', fontSize: '1.25em' }} />홈</span>, to: '/home' },
        { id: 'login', label: '로그인', to: '/login', onClick: handleLogin },
        { id: 'signup', label: '회원가입', to: '/signup' },
      ];

  const actionButton = isReallyLoggedIn
    ? { label: '로그아웃', onClick: handleLogout }
    : { label: '회원가입', to: '/signup', onClick: handleLogin };

  // 채팅방 목록 정렬 (최신 메시지 순)
  const sortedChatRooms = [...chatRooms].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.lastMessageTime || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.lastMessageTime || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  // 마지막 메시지 시간 '몇분 전' 등으로 표시하는 함수
  function formatTimeAgo(dateString) {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 60000); // 분 단위
    if (diff < 1) return '방금 전';
    if (diff < 60) return `${diff}분 전`;
    if (diff < 1440) return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('ko-KR');
  }

  return (
    <header className="sticky top-0 bg-white px-6 py-3 z-30 shadow-md font-pretendard" style={{ fontFamily: 'Pretendard, Montserrat, Noto Sans KR, sans-serif' }}>
      <div className="container mx-auto flex justify-between items-center h-16">
        <Link to="/" className="flex items-center space-x-2 select-none">
          <img src={logo} alt="fitpass logo" className="h-10 w-auto rounded-full shadow" />
          <span className="text-2xl font-extrabold tracking-tight text-black drop-shadow" style={{ fontFamily: 'Montserrat, Pretendard, Noto Sans KR, sans-serif' }}>FITPASS</span>
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
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-base font-semibold text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition focus:outline-none relative"
                  aria-label="알림"
                  style={{ lineHeight: 1.2 }}
                >
                  <span className="flex items-center gap-1 text-lg">{item.label}</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold shadow">{unreadCount}</span>
                  )}
                </button>
              ) : item.id === 'chat' ? (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-base font-semibold text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition focus:outline-none"
                  aria-label="채팅"
                  style={{ lineHeight: 1.2 }}
                >
                  <span className="flex items-center gap-1 text-lg">{item.label}</span>
                </button>
              ) : (
                <NavLink
                  key={item.id}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-base font-semibold transition font-sans ` +
                    (item.id === 'home'
                      ? 'text-gray-700 hover:bg-blue-100 hover:text-blue-600'
                      : (isActive
                          ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white shadow'
                          : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600'))
                  }
                  style={{ lineHeight: 1.2 }}
                >
                  <span className="flex items-center gap-1 text-lg">{item.label}</span>
                </NavLink>
              )
            ))}
          </nav>
          {isReallyLoggedIn ? (
            <Button onClick={handleLogout} className="ml-2 bg-gray-200 text-black font-semibold px-4 py-2 rounded-lg shadow hover:bg-gray-300 transition">
              로그아웃
            </Button>
          ) : (
            <Button
              onClick={() => { handleLogin(); navigate(actionButton.to); }}
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
          {isReallyLoggedIn ? (
            <Button onClick={() => { setMenuOpen(false); handleLogout(); }} className="w-11/12 mt-2 bg-gray-200 text-black font-semibold px-4 py-3 rounded-lg shadow hover:bg-gray-300 transition">
              로그아웃
            </Button>
          ) : (
            <Button
              onClick={() => { setMenuOpen(false); handleLogin(); navigate(actionButton.to); }}
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
      {/* 채팅방 목록 모달 */}
      {showChatRooms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowChatRooms(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-600">채팅방 목록</h2>
              <button className="text-gray-400 hover:text-blue-500" onClick={() => setShowChatRooms(false)}><FaTimes size={24} /></button>
            </div>
            {chatRooms.length === 0 ? (
              <div className="text-gray-400 text-center py-8">채팅방이 없습니다.</div>
            ) : (
              <ul className="flex flex-col gap-3">
                {sortedChatRooms.map(room => {
                  let opponentName = '';
                  let opponentImg = '';
                  if (userInfo?.userRole === 'USER' || userInfo?.userRole === 'PENDING_OWNER') {
                    opponentName = chatRoomNames[room.chatRoomId] || '체육관';
                    opponentImg = chatRoomImages[room.chatRoomId] || '';
                  } else if (userInfo?.userRole === 'OWNER') {
                    opponentName = chatRoomNames[room.chatRoomId] || '유저';
                    opponentImg = chatRoomImages[room.chatRoomId] || '';
                  } else {
                    opponentName = room.userName || '유저';
                    opponentImg = room.userImage || '';
                  }
                  const lastMsg = room.content || '';
                  const lastSender = room.senderType === (userInfo?.userRole === 'USER' ? 'USER' : 'GYM') ? '나' : opponentName;
                  const unread = room.unreadCount || 0;
                  const lastTime = room.updatedAt || room.lastMessageTime || room.createdAt;
                  return (
                    <li key={room.chatRoomId} className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 shadow border border-gray-100 px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-blue-100 transition" onClick={() => { setShowChatRooms(false); handleChatRoomClick(room.chatRoomId); }}>
                      {opponentImg ? (
                        <img src={opponentImg} alt={opponentName} className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shadow" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg shadow">
                          {opponentName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-base truncate max-w-[120px]">{opponentName}</span>
                          {unread > 0 && <span className="ml-1 bg-pink-500 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow">{unread}</span>}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px] mt-0.5">{lastSender} : {lastMsg}</div>
                      </div>
                      <div className="text-xs text-gray-400 ml-2 whitespace-nowrap">{formatTimeAgo(lastTime)}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
