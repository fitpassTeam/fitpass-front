import { useEffect, useState } from 'react';
import { FaUserCircle, FaPhone, FaBirthdayCake, FaMapMarkerAlt, FaVenusMars, FaCrown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// 임시: 실제로는 API에서 유저 정보를 받아와야 함
const mockUser = {
  email: 'user@example.com',
  name: '홍길동',
  phone: '010-1234-5678',
  age: 28,
  address: '서울시 강남구',
  gender: 'MAN',
  userRole: 'OWNER', // 또는 'OWNER'
};

function MyPage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: 실제로는 API에서 내 정보 받아오기
    setUser(mockUser);
  }, []);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-blue-400 animate-pulse text-xl font-bold">내 정보 불러오는 중...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-2 flex flex-col gap-8">
      {/* 상단 프로필 카드 */}
      <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center gap-6 p-8">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-lg">
            <FaUserCircle className="text-white text-6xl" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center sm:items-start">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-800">{user.name}</span>
            {user.userRole === 'OWNER' && (
              <span className="ml-2 px-3 py-1 bg-yellow-400 text-white rounded-full text-xs font-bold flex items-center gap-1">
                <FaCrown className="inline-block" /> OWNER
              </span>
            )}
          </div>
          <div className="text-gray-600 text-lg">{user.email}</div>
          <div className="mt-2 text-sm text-gray-500">권한: {user.userRole === 'OWNER' ? '사업자(OWNER)' : '일반회원(USER)'}</div>
          <button
            className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-bold shadow hover:from-pink-500 hover:to-blue-500 transition-all"
            onClick={() => navigate('/check-password')}
          >
            내 정보 수정
          </button>
        </div>
      </div>
      {/* 하단 정보 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <FaPhone className="text-blue-400 text-2xl mb-2" />
          <div className="text-gray-700 font-bold">전화번호</div>
          <div className="text-gray-600">{user.phone}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <FaBirthdayCake className="text-pink-400 text-2xl mb-2" />
          <div className="text-gray-700 font-bold">나이</div>
          <div className="text-gray-600">{user.age}세</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <FaMapMarkerAlt className="text-purple-400 text-2xl mb-2" />
          <div className="text-gray-700 font-bold">주소</div>
          <div className="text-gray-600">{user.address}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <FaVenusMars className="text-green-400 text-2xl mb-2" />
          <div className="text-gray-700 font-bold">성별</div>
          <div className="text-gray-600">{user.gender === 'MAN' ? '남성' : user.gender === 'WOMAN' ? '여성' : '기타'}</div>
        </div>
      </div>
      {/* OWNER 권한 전용 액션 카드 */}
      {user.userRole === 'OWNER' && (
        <div className="bg-gradient-to-r from-green-200 via-blue-100 to-purple-100 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center gap-6 p-8">
          <div className="flex-1 flex flex-col items-center sm:items-start">
            <div className="text-xl font-bold text-gray-800 mb-2">사업자 전용 메뉴</div>
            <div className="flex gap-4">
              <button
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow transition-all"
                onClick={() => navigate('/gymregister')}
              >
                체육관 등록
              </button>
              <button
                className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-bold shadow transition-all"
                onClick={() => alert('트레이너 등록 기능은 추후 지원 예정입니다.')}
              >
                트레이너 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPage; 