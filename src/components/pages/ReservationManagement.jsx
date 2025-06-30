import { useEffect, useState } from 'react';
import Select from 'react-select';
import { getMyGyms } from '../../api/gyms';
import { api } from '../../api/http';

function ReservationManagement() {
  const [gyms, setGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 내 체육관 목록 불러오기
  useEffect(() => {
    getMyGyms().then(res => {
      setGyms(Array.isArray(res.data.data) ? res.data.data : []);
    });
  }, []);

  // 체육관 선택 시 예약 목록 불러오기
  useEffect(() => {
    if (selectedGym) {
      setLoading(true);
      setError('');
      api.get(`/gyms/${selectedGym.value}/reservations`)
        .then(res => {
          const data = res.data;
          let list = Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.content) ? data.data.content : []);
          // 트레이너 이름 기준 오름차순 정렬
          list = list.slice().sort((a, b) => {
            const nameA = (a.trainerName || a.trainer?.name || '').toLowerCase();
            const nameB = (b.trainerName || b.trainer?.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          setReservations(list);
        })
        .catch(() => setError('예약 목록을 불러오지 못했습니다.'))
        .finally(() => setLoading(false));
    } else {
      setReservations([]);
    }
  }, [selectedGym]);

  const gymOptions = gyms.map(gym => ({ value: gym.id || gym.gymId || gym._id, label: gym.name, ...gym }));

  // 예약 승인/거절
  const handleReservationAction = async (reservation, action) => {
    if (!selectedGym) return;
    const gymId = selectedGym.value;
    const trainerId = reservation.trainerId || reservation.trainer_id || reservation.trainer?.id || reservation.trainerId || reservation.trainer_id;
    const reservationId = reservation.id || reservation.reservationId || reservation.reservation_id;
    const url = `/gyms/${gymId}/trainers/${trainerId}/reservations/${reservationId}/${action}`;
    if (!gymId || !trainerId || !reservationId) {
      alert('필수 정보 누락');
      return;
    }
    try {
      await api.patch(url);
      // 목록 새로고침
      const res = await api.get(`/gyms/${gymId}/reservations`);
      let list = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data.data?.content) ? res.data.data.content : []);
      list = list.slice().sort((a, b) => {
        const nameA = (a.trainerName || a.trainer?.name || '').toLowerCase();
        const nameB = (b.trainerName || b.trainer?.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setReservations(list);
    } catch {
      alert('처리 실패');
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white/90 p-10 rounded-2xl shadow-2xl mt-12 flex flex-col items-center">
      <h1 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text drop-shadow">
        예약 관리
      </h1>
      <div className="mb-4 w-full">
        <label htmlFor="gym-select" className="block font-semibold mb-1">내 체육관 선택</label>
        <Select
          inputId="gym-select"
          options={gymOptions}
          value={gymOptions.find(opt => opt.value === selectedGym?.value) || null}
          onChange={option => setSelectedGym(option)}
          placeholder="내 체육관 선택"
          isClearable
          menuPlacement="auto"
        />
      </div>
      {loading ? (
        <div className="text-blue-400 animate-pulse mt-4">예약 목록 불러오는 중...</div>
      ) : error ? (
        <div className="text-red-500 mt-4">{error}</div>
      ) : (
        <div className="mt-4 space-y-4 w-full">
          {reservations.length === 0 ? (
            <div className="text-gray-400">예약 내역이 없습니다.</div>
          ) : (
            reservations.map((r, idx) => (
              <div key={r.id || r.reservationId || idx} className="bg-white rounded-xl shadow p-4 flex flex-row justify-between items-center gap-4 border border-gray-100">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg">트레이너: {r.trainerName || r.trainer?.name || '-'}</div>
                  <div className="text-gray-600">예약자: {r.userName || r.user?.name || '-'}</div>
                  <div className="text-gray-600">날짜: {r.reservationDate} / 시간: {r.reservationTime}</div>
                  <div className="text-gray-600">상태: <span className="font-bold">{r.status}</span></div>
                </div>
                {r.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 min-w-[90px] items-end">
                    <button className="px-5 py-2 rounded-lg font-bold shadow bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 transition-all" onClick={() => handleReservationAction(r, 'confirm')}>승인</button>
                    <button className="px-5 py-2 rounded-lg font-bold shadow bg-gradient-to-r from-red-400 to-red-600 text-white hover:from-red-500 hover:to-red-700 transition-all" onClick={() => handleReservationAction(r, 'reject')}>거절</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ReservationManagement; 