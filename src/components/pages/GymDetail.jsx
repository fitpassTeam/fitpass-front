import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
// import Swiper 등 캐러셀 라이브러리 필요시 추가

function formatTime(time) {
  // "18:43:00" -> "18:43"
  if (!time) return '';
  return time.split(':').slice(0, 2).join(':');
}

function GymDetail() {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [mainIdx, setMainIdx] = useState(0); // 대표 이미지 인덱스
  const [modalOpen, setModalOpen] = useState(false);
  const [mainTrainerImgIdx, setMainTrainerImgIdx] = useState(0);
  
  // 로그인 상태 확인
  const isLoggedIn = !!localStorage.getItem('token');

  // 로그인 안내 함수
  const showLoginAlert = () => {
    alert('로그인한 유저만 이용할 수 있습니다.');
  };

  // 체육관 상세 (단일 상세 API가 없으면 기존 방식 유지)
  const { data: gymData, isLoading: gymLoading } = useQuery({
    queryKey: ['gym', gymId],
    queryFn: async () => {
      // 단일 상세 API가 있으면 아래로 교체
      // return api.get(`/gyms/${gymId}`).then(res => res.data.data);
      const res = await api.get('/gyms');
      const gyms = res.data?.data?.content || res.data?.content || [];
      const found = gyms.find(g => String(g.gymId) === String(gymId));
      if (!found) throw new Error('Not found');
      let gymImage = found.gymImage;
      if (typeof gymImage === 'string') {
        try { gymImage = JSON.parse(gymImage); } catch { gymImage = [gymImage]; }
      }
      return { ...found, gymImage };
    },
    enabled: !!gymId,
  });

  // 트레이너 목록
  const { data: trainers = [] } = useQuery({
    queryKey: ['trainers', gymId],
    queryFn: async () => {
      const res = await api.get(`/gyms/${gymId}/trainers`);
      const arr = Array.isArray(res.data.data?.content) ? res.data.data.content : (Array.isArray(res.data.data) ? res.data.data : []);
      return arr.map(tr => ({ ...tr, trainerImage: tr.images || [] }));
    },
    enabled: !!gymId,
  });

  // 이용권 목록
  const { data: memberships = [] } = useQuery({
    queryKey: ['memberships', gymId],
    queryFn: async () => {
      const res = await api.get(`/gyms/${gymId}/memberships`);
      return Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data.data?.content) ? res.data.data.content : []);
    },
    enabled: !!gymId,
  });

  useEffect(() => { setMainIdx(0); }, [gymData]);

  const selectedTrainer = trainers.find(tr => String(tr.id) === String(selectedTrainerId));

  if (gymLoading) return <div className="text-center py-20 text-xl text-blue-400 animate-pulse">로딩 중...</div>;
  if (!gymData) return <div className="text-center py-20 text-xl text-red-400">체육관 정보를 불러올 수 없습니다.</div>;

  return (
    <div className="max-w-5xl mx-auto mt-6 p-2 sm:p-6 bg-white rounded-2xl shadow-xl flex flex-col">
      {/* 상단: 체육관 소개 영역 */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-8">
        {/* 왼쪽: 사진 슬라이드 */}
        <div className="md:w-1/2 w-full flex flex-col items-center">
          <div className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
            {gymData.gymImage && gymData.gymImage.length > 0 ? (
              <img src={gymData.gymImage[mainIdx]} alt="대표사진" className="object-cover w-full h-full transition-all duration-300" />
            ) : (
              <span className="text-gray-400">이미지 없음</span>
            )}
          </div>
          {/* 썸네일 리스트 */}
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            {gymData.gymImage && gymData.gymImage.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`썸네일${idx+1}`}
                className={`w-16 h-16 object-cover rounded border-2 cursor-pointer ${mainIdx === idx ? 'border-blue-500' : 'border-gray-200'}`}
                onClick={() => setMainIdx(idx)}
              />
            ))}
          </div>
        </div>
        {/* 오른쪽: 체육관 정보 */}
        <div className="md:w-1/2 w-full flex flex-col gap-4 justify-between">
          <div>
            <div className="text-3xl font-extrabold mb-2">{gymData.name}</div>
            <div className="text-gray-600 mb-1">{gymData.address}</div>
            <div className="text-blue-500 font-semibold mb-2">{gymData.summary}</div>
            <div className="text-gray-700 mb-4 whitespace-pre-line">{gymData.content}</div>
            <div className="text-sm text-gray-500">운영시간: {formatTime(gymData.openTime)} ~ {formatTime(gymData.closeTime)}</div>
          </div>
        </div>
      </div>
      {/* 하단: 이용권 및 PT + 게시글 탭 */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* 트레이너 리스트 카드형 */}
        <div className="flex-1 bg-blue-50 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4">트레이너 목록</h2>
          <div className="flex flex-col gap-4">
            {trainers.length === 0 && <div className="text-gray-400">등록된 트레이너가 없습니다.</div>}
            {trainers.map(tr => (
              <div
                key={tr.id}
                className="p-4 bg-white rounded-xl shadow border border-blue-200 flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
                onClick={() => { setSelectedTrainerId(tr.id); setModalOpen(true); }}
              >
                <img src={tr.trainerImage?.[0] || 'https://via.placeholder.com/80?text=No+Image'} alt={tr.name} className="w-20 h-20 object-cover rounded-full border" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg">{tr.name}</div>
                  <div className="text-gray-500">₩{tr.price?.toLocaleString()}</div>
                </div>
                <button
                  className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                  onClick={e => { e.stopPropagation(); if (!isLoggedIn) { showLoginAlert(); return; } navigate(`/reservation?type=trainer&gymId=${gymId}&trainerId=${tr.id}`); }}
                >
                  예약하기
                </button>
              </div>
            ))}
          </div>
          {/* 트레이너 상세 모달 */}
          {modalOpen && selectedTrainer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
              <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[95vh] max-h-[95vh] overflow-y-auto p-4 sm:p-10 relative animate-fadeIn flex flex-col sm:flex-row items-start gap-10">
                {/* 왼쪽: 사진 영역 */}
                <div className="flex flex-col items-center justify-center max-w-[600px] w-full mx-auto">
                  <div className="flex items-center gap-2 mb-4 w-full">
                    <button
                      className="text-3xl text-gray-400 hover:text-blue-500 px-2"
                      onClick={() => {
                        const len = selectedTrainer.trainerImage?.length || 0;
                        if (len > 0) setMainTrainerImgIdx((mainTrainerImgIdx - 1 + len) % len);
                      }}
                      aria-label="이전 사진"
                    >
                      {'<'}
                    </button>
                    <img
                      src={selectedTrainer.trainerImage?.[mainTrainerImgIdx] || 'https://via.placeholder.com/600x800?text=No+Image'}
                      alt="대표사진"
                      className="mx-auto max-h-[80vh] w-full max-w-[600px] h-auto object-contain bg-gray-100 rounded-2xl border shadow-lg"
                    />
                    <button
                      className="text-3xl text-gray-400 hover:text-blue-500 px-2"
                      onClick={() => {
                        const len = selectedTrainer.trainerImage?.length || 0;
                        if (len > 0) setMainTrainerImgIdx((mainTrainerImgIdx + 1) % len);
                      }}
                      aria-label="다음 사진"
                    >
                      {'>'}
                    </button>
                  </div>
                  {/* 썸네일 리스트 */}
                  <div className="flex gap-2 mb-2 flex-wrap justify-center w-full">
                    {(selectedTrainer.trainerImage && selectedTrainer.trainerImage.length > 0)
                      ? selectedTrainer.trainerImage.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={selectedTrainer.name + ' 썸네일' + (idx+1)}
                            className={`w-20 h-20 object-cover rounded-lg border-2 cursor-pointer transition ${mainTrainerImgIdx === idx ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'}`}
                            onClick={() => setMainTrainerImgIdx(idx)}
                          />
                        ))
                      : <img src="https://via.placeholder.com/120x120?text=No+Image" alt="No Image" className="w-20 h-20 object-cover rounded-lg border" />
                    }
                  </div>
                </div>
                {/* 오른쪽: 정보 영역 */}
                <div className="flex flex-col flex-1 min-w-[320px] max-w-2xl justify-start">
                  <div className="flex flex-row items-start gap-4 mb-4 w-full">
                    <div className="font-extrabold text-2xl text-gray-900 flex-1 text-left">{selectedTrainer.name}</div>
                    <div className="font-semibold text-xl text-blue-500 text-right whitespace-nowrap">₩{selectedTrainer.price?.toLocaleString()}</div>
                  </div>
                  {/* 경력 */}
                  <div className="mb-2">
                    <div className="font-bold text-gray-700 mb-1">경력</div>
                    <div className="text-gray-700 whitespace-pre-line break-words bg-blue-50 rounded-lg p-3 min-h-[40px] max-h-80 overflow-y-auto">{selectedTrainer.experience || '경력 정보 없음'}</div>
                  </div>
                  {/* 자기소개 */}
                  <div className="mb-6">
                    <div className="font-bold text-gray-700 mb-1">자기소개</div>
                    <div className="text-gray-700 whitespace-pre-line break-words bg-purple-50 rounded-lg p-3 min-h-[60px] max-h-80 overflow-y-auto">{selectedTrainer.content || '자기소개 정보 없음'}</div>
                  </div>
                  <button
                    className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition text-lg mt-2"
                    onClick={() => { setModalOpen(false); setMainTrainerImgIdx(0); if (!isLoggedIn) { showLoginAlert(); return; } navigate(`/reservation?type=trainer&gymId=${gymId}&trainerId=${selectedTrainer.id}`); }}
                  >
                    트레이너 예약하기
                  </button>
                </div>
                {/* 닫기 버튼 */}
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl font-bold"
                  onClick={() => { setModalOpen(false); setMainTrainerImgIdx(0); }}
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
        {/* 이용권 리스트 카드형 */}
        <div className="flex-1 bg-purple-50 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4">이용권 목록</h2>
          <div className="flex flex-col gap-4">
            {memberships.length === 0 && <div className="text-gray-400">등록된 이용권이 없습니다.</div>}
            {memberships.map(mb => (
              <div key={mb.id} className="p-4 bg-white rounded-xl shadow border border-purple-200 flex flex-col gap-2">
                <div className="font-bold text-lg mb-1">{mb.name}</div>
                <div className="text-gray-500 mb-1">₩{mb.price?.toLocaleString()} / {mb.durationInDays}일</div>
                <div className="text-gray-700 mb-2 whitespace-pre-line">{mb.content}</div>
                <button
                  className="w-full bg-purple-500 text-white font-bold py-2 rounded-lg hover:bg-purple-600 transition"
                  onClick={() => { if (!isLoggedIn) { showLoginAlert(); return; } navigate(`/reservation?type=membership&gymId=${gymId}&membershipId=${mb.id}`); }}
                >
                  이용권 구매하기
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GymDetail; 