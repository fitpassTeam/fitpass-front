import { FaUserCircle, FaPhone, FaBirthdayCake, FaMapMarkerAlt, FaVenusMars, FaCrown, FaEdit, FaTrash, FaBars, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyReservations } from '../../api/reservation';
import { api } from '../../api/http';
import { useState } from 'react';
import { 
  getUsers, 
  chargeUserPoint, 
  getPendingOwnerRequests, 
  approveOwner, 
  rejectOwner, 
  getPendingGymRequests, 
  approveGym, 
  rejectGym, 
  requestUpgradeToOwner 
} from '../../api/user';

function MyPage() {
  const navigate = useNavigate();
  const [editLoading, setEditLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editModal, setEditModal] = useState({ open: false, r: null, date: '', time: '' });
  
  // 관리자 모달 상태들
  const [chargeModal, setChargeModal] = useState({ open: false, users: [], selectedUser: null, amount: '' });
  const [ownerModal, setOwnerModal] = useState({ open: false, requests: [] });
  const [gymModal, setGymModal] = useState({ open: false, requests: [] });
  const [menuOpen, setMenuOpen] = useState(false);

  // 내 정보
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data?.data;
    },
  });

  // 내 예약 (USER, PENDING_OWNER만)
  const {
    data: reservations = [],
    isLoading: reservationsLoading,
  } = useQuery({
    queryKey: ['myReservations'],
    queryFn: getMyReservations,
    select: res => res.data?.data || [],
    enabled: !!user && (user.userRole === 'USER' || user.userRole === 'PENDING_OWNER'),
  });

  // 예약 취소
  const handleCancel = async (r) => {
    if (!window.confirm('정말로 예약을 취소하시겠습니까?')) return;
    setCancelLoading(true);
    try {
      const gymId = r.gym?.gymId;
      const trainerId = r.trainer?.trainerId;
      const reservationId = r.reservationId;
      await api.delete(`/gyms/${gymId}/trainers/${trainerId}/reservations/${reservationId}`);
      setSuccessMsg('예약이 취소되었습니다.');
    } catch (e) {
      const msg = e?.response?.data?.message || '예약 취소에 실패했습니다.';
      setErrorMsg(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  // 예약 수정
  const handleEdit = (r) => {
    // 백엔드 정책과 동일하게 상태별 수정 가능 기간 체크
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const reservationDate = new Date(r.reservationDate);
    const daysUntilReservation = (reservationDate - new Date(todayStr)) / (1000 * 60 * 60 * 24);
    if (
      (r.status === 'PENDING' && daysUntilReservation < 2) ||
      (r.status === 'CONFIRMED' && daysUntilReservation < 7) ||
      r.status === 'COMPLETED' ||
      r.status === 'CANCELLED'
    ) {
      setErrorMsg(
        r.status === 'PENDING'
          ? '예약 2일 전까지만 변경이 가능합니다.'
          : r.status === 'CONFIRMED'
            ? '예약 7일 전까지만 변경이 가능합니다.'
            : '이 상태에서는 예약을 변경할 수 없습니다.'
      );
      return;
    }
    setEditModal({
      open: true,
      r,
      date: r.reservationDate,
      time: r.reservationTime?.slice(0,5) || '',
    });
  };

  const handleEditSave = async () => {
    const { r, date, time } = editModal;
    if (!date || !time) {
      setErrorMsg('날짜와 시간을 모두 선택해 주세요.');
      return;
    }
    // 정책 체크: 저장 시에도 선택한 날짜가 정책에 맞는지 확인
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const daysUntilReservation = (new Date(date) - new Date(todayStr)) / (1000 * 60 * 60 * 24);
    if (
      (r.status === 'PENDING' && daysUntilReservation < 2) ||
      (r.status === 'CONFIRMED' && daysUntilReservation < 7)
    ) {
      setErrorMsg(
        r.status === 'PENDING'
          ? '예약 2일 전까지만 변경이 가능합니다.'
          : '예약 7일 전까지만 변경이 가능합니다.'
      );
      setEditModal({ open: false, r: null, date: '', time: '' });
      return;
    }
    setEditLoading(true);
    try {
      const gymId = r.gym?.gymId;
      const trainerId = r.trainer?.trainerId;
      const reservationId = r.reservationId;
      await api.patch(`/gyms/${gymId}/trainers/${trainerId}/reservations/${reservationId}`, {
        reservationDate: date,
        reservationTime: time,
        reservationStatus: r.status // 기존 상태 유지
      });
      setEditModal({ open: false, r: null, date: '', time: '' });
      setSuccessMsg('예약이 수정되었습니다.');
    } catch (e) {
      const msg = e?.response?.data?.message || '예약 수정에 실패했습니다.';
      setErrorMsg(msg);
      setEditModal({ open: false, r: null, date: '', time: '' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditModalClose = () => setEditModal({ open: false, r: null, date: '', time: '' });

  // 관리자 기능 핸들러들
  const handleChargePoint = async () => {
    try {
      const users = await getUsers();
      setChargeModal({ open: true, users: users.data?.data || [], selectedUser: null, amount: '' });
    } catch (error) {
      setErrorMsg('사용자 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleOwnerRequests = async () => {
    try {
      const requests = await getPendingOwnerRequests();
      setOwnerModal({ open: true, requests: requests.data?.data || [] });
    } catch (error) {
      setErrorMsg('오너 권한 대기 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleGymRequests = async () => {
    try {
      const requests = await getPendingGymRequests();
      setGymModal({ open: true, requests: requests.data?.data || [] });
    } catch (error) {
      setErrorMsg('체육관 승인 대기 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleApproveOwner = async (userId) => {
    try {
      await approveOwner(userId);
      setSuccessMsg('오너 권한이 승인되었습니다.');
      // 목록 새로고침
      const requests = await getPendingOwnerRequests();
      setOwnerModal(prev => ({ ...prev, requests: requests.data?.data || [] }));
    } catch (error) {
      setErrorMsg('오너 권한 승인에 실패했습니다.');
    }
  };

  const handleRejectOwner = async (userId) => {
    try {
      await rejectOwner(userId);
      setSuccessMsg('오너 권한이 거절되었습니다.');
      // 목록 새로고침
      const requests = await getPendingOwnerRequests();
      setOwnerModal(prev => ({ ...prev, requests: requests.data?.data || [] }));
    } catch (error) {
      setErrorMsg('오너 권한 거절에 실패했습니다.');
    }
  };

  const handleApproveGym = async (gymId) => {
    try {
      await approveGym(gymId);
      setSuccessMsg('승인을 성공하였습니다.');
      // 목록 새로고침
      const requests = await getPendingGymRequests();
      setGymModal(prev => ({ ...prev, requests: requests.data?.data || [] }));
    } catch (error) {
      setErrorMsg('체육관 승인에 실패했습니다.');
    }
  };

  const handleRejectGym = async (gymId) => {
    try {
      await rejectGym(gymId);
      setSuccessMsg('체육관이 거절되었습니다.');
      // 목록 새로고침
      const requests = await getPendingGymRequests();
      setGymModal(prev => ({ ...prev, requests: requests.data?.data || [] }));
    } catch (error) {
      setErrorMsg('체육관 거절에 실패했습니다.');
    }
  };

  const handleChargeSubmit = async () => {
    if (!chargeModal.selectedUser || !chargeModal.amount) {
      setErrorMsg('사용자와 충전 금액을 선택해 주세요.');
      return;
    }
    try {
      await chargeUserPoint(chargeModal.selectedUser, parseInt(chargeModal.amount));
      setSuccessMsg('포인트가 충전되었습니다.');
      setChargeModal({ open: false, users: [], selectedUser: null, amount: '' });
    } catch (error) {
      setErrorMsg('포인트 충전에 실패했습니다.');
    }
  };

  // 오너 권한 신청 핸들러
  const handleRequestOwner = async () => {
    try {
      await requestUpgradeToOwner();
      setSuccessMsg('오너 권한 신청이 완료되었습니다!');
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || '오너 권한 신청에 실패했습니다.');
    }
  };

  // 시간 드롭다운 생성 함수 (1시간 단위)
  function getAvailableTimes(openTime, closeTime) {
    if (!openTime || !closeTime) return [];
    const start = parseInt(openTime.split(':')[0], 10);
    const end = parseInt(closeTime.split(':')[0], 10);
    const times = [];
    for (let h = start; h <= end; h++) {
      times.push((h < 10 ? '0' : '') + h + ':00');
    }
    return times;
  }

  // 예약 수정 모달: 이미 예약된 시간(같은 트레이너, 같은 날짜, 상태가 PENDING/CONFIRMED/COMPLETED) 제외
  function getReservedTimes(trainerId, date, reservations, currentReservationId) {
    return reservations
      .filter(r => r.trainer?.trainerId === trainerId && r.reservationDate === date && r.reservationId !== currentReservationId && ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(r.status))
      .map(r => r.reservationTime?.slice(0,5));
  }

  if (userLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-blue-400 animate-pulse text-xl font-bold">내 정보 불러오는 중...</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full p-4 sm:p-8 flex flex-col gap-6">
        {/* 상단 프로필 카드 */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-lg overflow-hidden">
              {user.userImage ? (
                <img src={user.userImage} alt="프로필" className="object-cover w-full h-full" />
              ) : (
                <FaUserCircle className="text-white text-6xl" />
              )}
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
              {user.userRole === 'ADMIN' && (
                <span className="ml-2 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold flex items-center gap-1">
                  ADMIN
                </span>
              )}
            </div>
            <div className="text-gray-600 text-lg">{user.email}</div>
            <div className="mt-2 text-sm text-gray-500">권한: {user.userRole === 'OWNER' ? '사업자(OWNER)' : user.userRole === 'ADMIN' ? '관리자(ADMIN)' : '일반회원(USER)'}</div>
            {/* 내 포인트 잔액 */}
            <div className="mt-2 text-base text-blue-700 font-bold">
              {user.pointBalance !== undefined && user.pointBalance !== null
                ? `포인트 잔액: ${user.pointBalance}P`
                : '포인트 불러오는 중...'}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-bold shadow hover:from-pink-500 hover:to-blue-500 transition-all"
                onClick={() => navigate('/check-password')}
              >
                내 정보 수정
              </button>
              {(user.userRole === 'USER' || user.userRole === 'PENDING_OWNER') && (
                <button
                  className="px-6 py-2 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-full font-bold shadow hover:from-blue-500 hover:to-green-500 transition-all"
                  onClick={handleRequestOwner}
                  disabled={user.userRole === 'PENDING_OWNER'}
                >
                  {user.userRole === 'PENDING_OWNER' ? '오너 권한 신청중' : '오너 권한 신청'}
                </button>
              )}
            </div>
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
          <div className="w-full">
            {/* 모바일: 햄버거 메뉴 */}
            <div className="flex justify-end sm:hidden">
              <button
                className="p-2"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="사업자 메뉴 열기"
              >
                {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            </div>
            {/* PC: 기존 메뉴 */}
            <div className="flex justify-center mt-8">
              <div className="inline-flex bg-gradient-to-r from-green-200 via-blue-100 to-purple-100 rounded-2xl shadow-lg items-center gap-2 p-8 w-auto mx-auto">
                <div className="text-xl font-bold text-gray-800 mr-6">사업자 전용 메뉴</div>
                <div className="flex flex-wrap gap-2 justify-center min-w-0 overflow-x-auto">
                  <button className="min-w-[120px] px-8 py-3 whitespace-nowrap bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow transition-all" onClick={() => navigate('/gym-management')}>체육관 관리</button>
                  <button className="min-w-[120px] px-8 py-3 whitespace-nowrap bg-pink-500 hover:bg-pink-600 text-white rounded-full font-bold shadow transition-all" onClick={() => navigate('/trainer-management')}>트레이너 관리</button>
                  <button className="min-w-[120px] px-8 py-3 whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold shadow transition-all" onClick={() => navigate('/membership-management')}>이용권 관리</button>
                  <button className="min-w-[120px] px-8 py-3 whitespace-nowrap bg-purple-500 hover:bg-purple-600 text-white rounded-full font-bold shadow transition-all" onClick={() => navigate('/reservation-management')}>예약 관리</button>
                  <button className="min-w-[120px] px-8 py-3 whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 text-white rounded-full font-bold shadow transition-all" onClick={() => navigate('/post-management')}>게시글 관리</button>
                </div>
              </div>
            </div>
            {/* 모바일: 드롭다운 메뉴 */}
            {menuOpen && (
              <div className="flex flex-col gap-2 mt-2 sm:hidden bg-gradient-to-r from-green-200 via-blue-100 to-purple-100 rounded-2xl shadow-lg p-4 animate-fadeIn max-w-5xl mx-auto">
                <div className="text-xl font-bold text-gray-800 mb-2">사업자 전용 메뉴</div>
                <div className="flex flex-wrap gap-2 justify-center min-w-0 overflow-x-auto">
                  <button className="min-w-[120px] px-8 py-3 whitespace-nowrap bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow transition-all" onClick={() => { setMenuOpen(false); navigate('/gym-management'); }}>체육관 관리</button>
                  <button className="min-w-[120px] px-8 py-3 whitespace-nowrap bg-pink-500 hover:bg-pink-600 text-white rounded-full font-bold shadow transition-all" onClick={() => { setMenuOpen(false); navigate('/trainer-management'); }}>트레이너 관리</button>
                  <button className="min-w-[120px] px-8 py-3 whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold shadow transition-all" onClick={() => { setMenuOpen(false); navigate('/membership-management'); }}>이용권 관리</button>
                  <button className="min-w-[120px] px-8 py-3 whitespace-nowrap bg-purple-500 hover:bg-purple-600 text-white rounded-full font-bold shadow transition-all" onClick={() => { setMenuOpen(false); navigate('/reservation-management'); }}>예약 관리</button>
                  <button className="min-w-[120px] px-8 py-3 whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 text-white rounded-full font-bold shadow transition-all" onClick={() => { setMenuOpen(false); navigate('/post-management'); }}>게시글 관리</button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* USER, PENDING_OWNER 권한: 나의 예약현황 */}
        {(user.userRole === 'USER' || user.userRole === 'PENDING_OWNER') && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 mt-4">
            <div className="text-xl font-bold text-gray-800 mb-4">나의 예약 현황</div>
            {reservationsLoading ? (
              <div className="text-blue-400 animate-pulse">예약 목록 불러오는 중...</div>
            ) : reservations.length === 0 ? (
              <div className="text-gray-400">예약 내역이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <ul className="flex flex-col gap-4">
                  {[
                    ...reservations.filter(r => r.status !== 'CANCELLED').sort((a, b) => a.reservationDate.localeCompare(b.reservationDate)),
                    ...reservations.filter(r => r.status === 'CANCELLED').sort((a, b) => a.reservationDate.localeCompare(b.reservationDate)),
                  ].map((r) => (
                    <li
                      key={r.reservationId}
                      className="bg-white rounded-xl shadow-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100 hover:shadow-lg transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-blue-700">{r.gym?.name}</span>
                          {r.trainer?.name && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                              {r.trainer.name}
                            </span>
                          )}
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-bold
                            ${r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              r.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                              r.status === 'COMPLETED' ? 'bg-gray-200 text-gray-600' :
                              'bg-red-100 text-red-600'}
                          `}>
                            {r.status}
                          </span>
                        </div>
                        <div className="text-gray-600 text-sm mb-1">
                          {r.reservationDate} {r.reservationTime?.slice(0,5)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          예약 생성: {r.createdAt?.replace('T', ' ').slice(0, 16)}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        {r.status !== 'CANCELLED' && (
                          <>
                            <button
                              className="flex items-center gap-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full text-sm font-bold shadow transition-all disabled:opacity-50"
                              onClick={() => handleEdit(r)}
                              disabled={editLoading}
                            >
                              <FaEdit /> 수정
                            </button>
                            <button
                              className="flex items-center gap-1 px-4 py-2 bg-red-400 hover:bg-red-500 text-white rounded-full text-sm font-bold shadow transition-all disabled:opacity-50"
                              onClick={() => handleCancel(r)}
                              disabled={cancelLoading}
                            >
                              <FaTrash /> 취소
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {/* ADMIN 권한: 전용 액션 카드 */}
        {user.userRole === 'ADMIN' && (
          <div className="w-full">
            {/* 모바일: 햄버거 메뉴 */}
            <div className="flex justify-end sm:hidden">
              <button
                className="p-2"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="관리자 메뉴 열기"
              >
                {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            </div>
            {/* PC: 기존 메뉴 */}
            <div className="hidden sm:flex bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl shadow-lg flex-row items-center gap-6 p-8 mt-4">
              <div className="text-xl font-bold text-gray-800 mb-4">관리자 전용 메뉴</div>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold shadow transition-all" onClick={handleChargePoint}>포인트 충전</button>
                <button className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow transition-all" onClick={handleOwnerRequests}>오너 권한 대기 목록</button>
                <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-bold shadow transition-all" onClick={handleGymRequests}>체육관 승인 대기 목록</button>
              </div>
            </div>
            {/* 모바일: 드롭다운 메뉴 */}
            {menuOpen && (
              <div className="flex flex-col gap-2 mt-2 sm:hidden bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl shadow-lg p-4 animate-fadeIn">
                <div className="text-xl font-bold text-gray-800 mb-2">관리자 전용 메뉴</div>
                <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold shadow transition-all" onClick={() => { setMenuOpen(false); handleChargePoint(); }}>포인트 충전</button>
                <button className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow transition-all" onClick={() => { setMenuOpen(false); handleOwnerRequests(); }}>오너 권한 대기 목록</button>
                <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-bold shadow transition-all" onClick={() => { setMenuOpen(false); handleGymRequests(); }}>체육관 승인 대기 목록</button>
              </div>
            )}
          </div>
        )}
        {/* 에러 모달 */}
        {errorMsg && (
          <div className="fixed inset-0 flex items-center justify-center min-h-screen bg-black/10 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="text-lg font-bold text-blue-500 mb-4 text-center">알림</div>
              <div className="text-gray-700 text-center mb-6 whitespace-pre-line">{errorMsg}</div>
              <button
                className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold shadow hover:bg-blue-600 transition block mx-auto"
                onClick={() => setErrorMsg('')}
              >
                확인
              </button>
            </div>
          </div>
        )}
        {/* 성공 모달 */}
        {successMsg && (
          <div className="fixed inset-0 flex items-center justify-center min-h-screen bg-black/10 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="text-lg font-bold text-blue-500 mb-4 text-center">알림</div>
              <div className="text-gray-700 text-center mb-6 whitespace-pre-line">{successMsg}</div>
              <button
                className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold shadow hover:bg-blue-600 transition block mx-auto"
                onClick={() => window.location.reload()}
              >
                확인
              </button>
            </div>
          </div>
        )}
        {/* 예약 수정 모달 */}
        {editModal.open && (
          <div className="fixed inset-0 flex items-center justify-center p-2">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xs sm:max-w-md md:max-w-2xl p-4">
              <div className="text-lg font-bold text-blue-500 mb-4">예약 수정</div>
              <div className="w-full mb-4">
                <label className="block font-semibold mb-1">날짜</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={editModal.date}
                  onChange={e => setEditModal(modal => ({ ...modal, date: e.target.value }))}
                />
              </div>
              <div className="w-full mb-6">
                <label className="block font-semibold mb-1">시간</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={editModal.time}
                  onChange={e => setEditModal(modal => ({ ...modal, time: e.target.value }))}
                >
                  <option value="">시간 선택</option>
                  {getAvailableTimes(editModal.r?.gym?.openTime || '09:00:00', editModal.r?.gym?.closeTime || '18:00:00')
                    .filter(t => !getReservedTimes(editModal.r?.trainer?.trainerId, editModal.date, reservations, editModal.r?.reservationId).includes(t) || t === editModal.r?.reservationTime?.slice(0,5))
                    .map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                </select>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-full font-bold shadow hover:bg-blue-600 transition disabled:opacity-50"
                  onClick={handleEditSave}
                  disabled={editLoading}
                >
                  저장
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-full font-bold shadow hover:bg-gray-400 transition"
                  onClick={handleEditModalClose}
                  disabled={editLoading}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 포인트 충전 모달 */}
        {chargeModal.open && (
          <div className="fixed inset-0 flex items-center justify-center p-2">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xs sm:max-w-md md:max-w-2xl p-4">
              <div className="text-lg font-bold text-blue-500 mb-4">포인트 충전</div>
              <div className="w-full mb-4">
                <label className="block font-semibold mb-1">사용자 선택</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={chargeModal.selectedUser || ''}
                  onChange={e => setChargeModal(prev => ({ ...prev, selectedUser: e.target.value }))}
                >
                  <option value="">사용자 선택</option>
                  {chargeModal.users.map(user => (
                    <option key={user.userId} value={user.userId}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full mb-6">
                <label className="block font-semibold mb-1">충전 금액</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  placeholder="충전할 포인트"
                  value={chargeModal.amount}
                  onChange={e => setChargeModal(prev => ({ ...prev, amount: e.target.value }))}
                  min="1"
                />
              </div>
              <div className="flex gap-2 w-full">
                <button
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-full font-bold shadow hover:bg-blue-600 transition"
                  onClick={handleChargeSubmit}
                >
                  충전
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-full font-bold shadow hover:bg-gray-400 transition"
                  onClick={() => setChargeModal({ open: false, users: [], selectedUser: null, amount: '' })}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 오너 권한 대기 목록 모달 */}
        {ownerModal.open && (
          <div className="fixed inset-0 flex items-center justify-center p-2">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xs sm:max-w-md md:max-w-2xl p-4">
              <div className="text-lg font-bold text-green-500 mb-4">오너 권한 대기 목록</div>
              {ownerModal.requests.length === 0 ? (
                <div className="text-gray-400 text-center py-8">대기 중인 오너 권한 요청이 없습니다.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ownerModal.requests.map(request => (
                    <div key={request.userId} className="rounded-xl bg-gradient-to-br from-green-50 to-blue-50 shadow border border-gray-200 p-6 flex flex-col gap-2 hover:shadow-lg transition">
                      <div className="font-bold text-lg text-gray-800 mb-1 truncate">{request.name}</div>
                      <div className="text-sm text-gray-600 mb-1 truncate">{request.email}</div>
                      <div className="text-xs text-gray-500 mb-2">{request.phone}</div>
                      <div className="flex gap-2 mt-2 self-end">
                        <button
                          className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold shadow hover:bg-green-600 transition"
                          onClick={() => handleApproveOwner(request.userId)}
                        >
                          승인
                        </button>
                        <button
                          className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold shadow hover:bg-red-600 transition"
                          onClick={() => handleRejectOwner(request.userId)}
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="mt-6 px-6 py-2 bg-gray-300 text-gray-700 rounded-full font-bold shadow hover:bg-gray-400 transition"
                onClick={() => setOwnerModal({ open: false, requests: [] })}
              >
                닫기
              </button>
            </div>
          </div>
        )}
        {/* 체육관 승인 대기 목록 모달 */}
        {gymModal.open && (
          <div className="fixed inset-0 flex items-center justify-center p-2">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xs sm:max-w-md md:max-w-2xl p-4">
              <div className="text-lg font-bold text-purple-500 mb-4">체육관 승인 대기 목록</div>
              {gymModal.requests.length === 0 ? (
                <div className="text-gray-400 text-center py-8">대기 중인 체육관 승인 요청이 없습니다.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gymModal.requests.map(request => (
                    <div key={request.gymId} className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 shadow border border-gray-200 p-6 flex flex-col gap-2 hover:shadow-lg transition">
                      <div className="font-bold text-lg text-gray-800 mb-1 truncate">{request.name}</div>
                      <div className="text-sm text-gray-600 mb-1 truncate">{request.address}</div>
                      {/* 오너 정보가 있으면 표시, 없으면 생략 */}
                      {request.ownerName && (
                        <div className="text-xs text-gray-500 mb-2">{request.ownerName}</div>
                      )}
                      <div className="flex gap-2 mt-2 self-end">
                        <button
                          className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold shadow hover:bg-green-600 transition"
                          onClick={() => handleApproveGym(request.gymId)}
                        >
                          승인
                        </button>
                        <button
                          className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold shadow hover:bg-red-600 transition"
                          onClick={() => handleRejectGym(request.gymId)}
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="mt-6 px-6 py-2 bg-gray-300 text-gray-700 rounded-full font-bold shadow hover:bg-gray-400 transition"
                onClick={() => setGymModal({ open: false, requests: [] })}
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage; 