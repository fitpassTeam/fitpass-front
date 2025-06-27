import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createTrainerReservation, getTrainerReservations, getTrainerDetail } from '../../api/reservation';
import { getMyPoint } from '../../api/user';
import { api } from '../../api/http';

function Reservation() {
  const [params] = useSearchParams();
  const gymId = params.get('gymId');
  const trainerId = params.get('trainerId');
  const membershipId = params.get('membershipId');
  const type = params.get('type'); // 'trainer' | 'membership'
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [reservedTimes, setReservedTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [point, setPoint] = useState(null);
  const [trainerPrice, setTrainerPrice] = useState(null);
  const [membershipPrice, setMembershipPrice] = useState(null);
  const [membershipInfo, setMembershipInfo] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // 포인트 조회
  useEffect(() => {
    getMyPoint()
      .then(res => setPoint(res.data?.data?.balance))
      .catch(() => setPoint(null));
  }, []);

  // 트레이너 정보 조회
  useEffect(() => {
    async function fetchTrainer() {
      try {
        const res = await getTrainerDetail({ gymId, trainerId });
        setTrainerPrice(res.data?.data?.price || 0);
        setSelectedTrainer(res.data?.data);
      } catch {
        setTrainerPrice(0);
      }
    }
    if (gymId && trainerId) fetchTrainer();
  }, [gymId, trainerId]);

  // 이용권 정보 조회
  useEffect(() => {
    async function fetchMembership() {
      try {
        const res = await api.get(`/gyms/${gymId}/memberships/${membershipId}`);
        const membershipData = res.data?.data;
        setMembershipInfo(membershipData);
        setMembershipPrice(membershipData?.price || 0);
      } catch (error) {
        setMembershipPrice(0);
        setMembershipInfo(null);
      }
    }
    if (gymId && membershipId) fetchMembership();
  }, [gymId, membershipId]);

  // 날짜 선택 시 예약된 시간 조회 (트레이너 예약만)
  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);
    setSelectedTime('');
    
    if (type === 'trainer') {
      setAvailableTimes(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']);
      setReservedTimes([]);
      if (!selectedDate) return;
      setLoadingTimes(true);
      try {
        const res = await getTrainerReservations({ gymId, trainerId });
        // 예약 리스트에서 해당 날짜의 예약만 추출
        const reserved = (res.data?.data || [])
          .filter(r => r.reservationDate === selectedDate && (r.status === 'COMPLETED' || r.status === 'CONFIRMED' || r.status === 'PENDING'))
          .map(r => r.reservationTime.slice(0, 5)); // '09:00:00' -> '09:00'
        setReservedTimes(reserved);
      } catch {
        setReservedTimes([]);
      } finally {
        setLoadingTimes(false);
      }
    }
  };

  // 날짜 제한 계산 (구매 시점부터 7일)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
  };

  const handleReserve = async () => {
    if (type === 'trainer' && (!date || !selectedTime)) return;
    if (type === 'membership' && !date) return;
    
    setLoading(true);
    try {
      if (type === 'trainer') {
        await createTrainerReservation({
          gymId,
          trainerId,
          reservationDate: date,
          reservationTime: selectedTime,
        });
      } else if (type === 'membership') {
        // 이용권 구매 API 호출
        await api.post(`/gyms/${gymId}/memberships/${membershipId}/purchase?activationDate=${date}`);
      }
      
      // 예약/구매 후 포인트 재조회
      const res = await getMyPoint();
      setPoint(res.data?.data?.balance);
      alert(type === 'trainer' ? '예약이 완료되었습니다!' : '이용권 구매가 완료되었습니다!');
      navigate('/mypage');
    } catch (e) {
      // 에러 응답에서 message 추출
      let msg = type === 'trainer' ? '예약에 실패했습니다. 다시 시도해주세요.' : '이용권 구매에 실패했습니다. 다시 시도해주세요.';
      if (e.response && e.response.data && e.response.data.message) {
        msg = e.response.data.message;
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const isTrainerMode = type === 'trainer';
  const isMembershipMode = type === 'membership';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-blue-600">
          {isTrainerMode ? '트레이너 예약' : '이용권 구매'}
        </h1>
        
        {/* 트레이너 정보 표시 */}
        {isTrainerMode && selectedTrainer && (
          <div className="w-full mb-6 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="font-bold text-lg mb-2">{selectedTrainer?.name || '트레이너명 없음'}</div>
            <div className="text-gray-600 mb-1">{selectedTrainer?.price?.toLocaleString() || 0}P</div>
          </div>
        )}
        {/* 트레이너 예약 시 포인트/가격/잔액 표시 */}
        {isTrainerMode && (
          <>
            <div className="w-full mb-2 text-right text-blue-600 font-bold">
              보유 포인트: {typeof point === 'number' ? point.toLocaleString() : '0'}P
            </div>
            <div className="w-full mb-2 text-right text-purple-600 font-bold">
              트레이너 가격: {selectedTrainer?.price?.toLocaleString() || 0}P
            </div>
            <div className="w-full mb-4 text-right text-gray-500 text-sm">
              예약 후 예상 잔액: {
                typeof point === 'number' && typeof selectedTrainer?.price === 'number'
                  ? (point - (selectedTrainer?.price ?? 0)).toLocaleString()
                  : '0'
              }P
            </div>
          </>
        )}
        {/* 이용권 정보 표시 */}
        {isMembershipMode && (
          <div className="w-full mb-6 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="font-bold text-lg mb-2">{membershipInfo?.name || '이용권명 없음'}</div>
            <div className="text-gray-600 mb-1">{(membershipInfo?.price ?? membershipPrice ?? 0).toLocaleString()}P / {membershipInfo?.durationInDays || '-'}일</div>
            <div className="text-gray-700 text-sm">{membershipInfo?.content || '설명 없음'}</div>
          </div>
        )}
        {isMembershipMode && (
          <div className="w-full mb-2 text-right text-purple-600 font-bold">
            이용권 가격: {(membershipInfo?.price ?? membershipPrice ?? 0).toLocaleString()}P
          </div>
        )}
        <div className="w-full mb-4 text-right text-gray-500 text-sm">
          {isTrainerMode
            ? null
            : <>구매 후 예상 잔액: {
                typeof point === 'number' && typeof (membershipInfo?.price ?? membershipPrice) === 'number'
                  ? (point - (membershipInfo?.price ?? membershipPrice ?? 0)).toLocaleString()
                  : '0'
              }P</>
          }
        </div>
        
        <div className="w-full mb-6">
          <div className="font-bold mb-2">
            {isMembershipMode ? '구매 날짜 선택 (7일 이내)' : '날짜 선택'}
          </div>
          <input
            type="date"
            className="w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={date}
            onChange={handleDateChange}
            min={getMinDate()}
            max={isMembershipMode ? getMaxDate() : undefined}
          />
          {isMembershipMode && (
            <div className="text-xs text-gray-500 mt-1">
              구매 시점부터 7일까지만 선택 가능합니다.
            </div>
          )}
        </div>
        
        {/* 시간 선택 (트레이너 예약만) */}
        {isTrainerMode && (
          <div className="w-full mb-6">
            <div className="font-bold mb-2">시간 선택</div>
            <div className="flex flex-wrap gap-2">
              {availableTimes.length === 0 && <div className="text-gray-400">날짜를 먼저 선택하세요.</div>}
              {loadingTimes && <div className="text-blue-400 animate-pulse">예약 가능 시간 불러오는 중...</div>}
              {availableTimes.map(time => {
                const isReserved = reservedTimes.includes(time);
                return (
                  <button
                    key={time}
                    className={`px-4 py-2 rounded-lg border font-semibold transition
                      ${isReserved ? 'bg-gray-300 text-white border-gray-300 cursor-not-allowed' :
                        selectedTime === time ? 'bg-blue-500 text-white border-blue-500' :
                        'bg-gray-100 text-gray-700 border-gray-200 hover:bg-blue-100'}
                    `}
                    onClick={() => !isReserved && setSelectedTime(time)}
                    type="button"
                    disabled={loading || isReserved}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        <button
          className={`w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition text-lg mt-2 ${
            (isTrainerMode && (!date || !selectedTime)) || (isMembershipMode && !date) || loading 
              ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={(isTrainerMode && (!date || !selectedTime)) || (isMembershipMode && !date) || loading}
          onClick={handleReserve}
        >
          {loading ? (isTrainerMode ? '예약 중...' : '구매 중...') : (isTrainerMode ? '예약' : '구매')}
        </button>
      </div>
    </div>
  );
}

export default Reservation; 