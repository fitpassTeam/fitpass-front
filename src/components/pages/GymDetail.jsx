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
  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const [mainIdx, setMainIdx] = useState(0); // 대표 이미지 인덱스
  const [tab, setTab] = useState('pass'); // 'pass' | 'post'
  const [modalOpen, setModalOpen] = useState(false);

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

  const selectedMembership = memberships.find(mb => String(mb.id) === String(selectedMembershipId));
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
        <div className="flex-1 bg-blue-50 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4">트레이너 목록</h2>
          {/* 선택창 */}
          <select
            className="w-full mb-4 p-2 rounded border"
            value={selectedTrainerId}
            onChange={e => setSelectedTrainerId(e.target.value)}
          >
            <option value="">트레이너를 선택하세요</option>
            {trainers.map(tr => (
              <option key={tr.id} value={tr.id}>{tr.name}</option>
            ))}
          </select>
          {/* 상세 카드 */}
          {selectedTrainer && (
            <>
              <div
                className="p-4 bg-white rounded-xl shadow border border-blue-200 mb-4 cursor-pointer hover:shadow-lg transition"
                onClick={() => setModalOpen(true)}
              >
                <div className="flex items-center gap-4 mb-2">
                  <img src={selectedTrainer.trainerImage?.[0] || 'https://via.placeholder.com/80?text=No+Image'} alt={selectedTrainer.name} className="w-20 h-20 object-cover rounded-full border" />
                  <div>
                    <div className="font-bold text-lg">{selectedTrainer.name}</div>
                    <div className="text-gray-500">₩{selectedTrainer.price?.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-1">{selectedTrainer.trainerStatus}</div>
                  </div>
                </div>
                <button
                  className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition mt-2"
                  onClick={e => { e.stopPropagation(); navigate(`/reservation?type=trainer&gymId=${gymId}&trainerId=${selectedTrainer.id}`); }}
                >
                  트레이너 예약하기
                </button>
              </div>
              {/* 모달 */}
              {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fadeIn flex flex-col items-center">
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-pink-500 text-2xl font-bold"
                      onClick={() => setModalOpen(false)}
                      aria-label="닫기"
                    >
                      ×
                    </button>
                    {/* 이미지 여러장 */}
                    <div className="flex gap-2 mb-4 flex-wrap justify-center">
                      {(selectedTrainer.trainerImage && selectedTrainer.trainerImage.length > 0)
                        ? selectedTrainer.trainerImage.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={selectedTrainer.name + ' 사진' + (idx+1)}
                              className="w-24 h-24 object-cover rounded-lg border shadow"
                            />
                          ))
                        : <img src="https://via.placeholder.com/120?text=No+Image" alt="No Image" className="w-24 h-24 object-cover rounded-lg border shadow" />
                      }
                    </div>
                    <div className="text-2xl font-extrabold mb-1 text-center">{selectedTrainer.name}</div>
                    <div className="text-blue-500 font-semibold mb-2 text-center">₩{selectedTrainer.price?.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mb-2 text-center">{selectedTrainer.trainerStatus}</div>
                    <div className="w-full mb-3">
                      <div className="font-bold text-gray-700 mb-1">경력</div>
                      <div className="text-gray-700 whitespace-pre-line break-words bg-blue-50 rounded-lg p-3 min-h-[40px]">{selectedTrainer.experience || '경력 정보 없음'}</div>
                    </div>
                    <div className="w-full mb-4">
                      <div className="font-bold text-gray-700 mb-1">자기소개</div>
                      <div className="text-gray-700 whitespace-pre-line break-words bg-purple-50 rounded-lg p-3 min-h-[60px] max-h-60 overflow-y-auto">{selectedTrainer.content || '자기소개 정보 없음'}</div>
                    </div>
                    <button
                      className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition text-lg mt-2"
                      onClick={() => { setModalOpen(false); navigate(`/reservation?type=trainer&gymId=${gymId}&trainerId=${selectedTrainer.id}`); }}
                    >
                      트레이너 예약하기
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {trainers.length === 0 && <div className="text-gray-400">등록된 트레이너가 없습니다.</div>}
        </div>
        <div className="flex-1 bg-purple-50 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4">이용권 목록</h2>
          {/* 선택창 */}
          <select
            className="w-full mb-4 p-2 rounded border"
            value={selectedMembershipId}
            onChange={e => setSelectedMembershipId(e.target.value)}
          >
            <option value="">이용권을 선택하세요</option>
            {memberships.map(mb => (
              <option key={mb.id} value={mb.id}>{mb.name}</option>
            ))}
          </select>
          {/* 상세 카드 */}
          {selectedMembership && (
            <div className="p-4 bg-white rounded-xl shadow border border-purple-200 mb-4">
              <div className="font-bold text-lg mb-1">{selectedMembership.name}</div>
              <div className="text-gray-500 mb-1">₩{selectedMembership.price?.toLocaleString()} / {selectedMembership.durationInDays}일</div>
              <div className="text-gray-700 mb-2 whitespace-pre-line">{selectedMembership.content}</div>
              <button
                className="w-full bg-purple-500 text-white font-bold py-2 rounded-lg hover:bg-purple-600 transition"
                onClick={() => navigate(`/reservation?type=membership&gymId=${gymId}&membershipId=${selectedMembership.id}`)}
              >
                이용권 구매하기
              </button>
            </div>
          )}
          {memberships.length === 0 && <div className="text-gray-400">등록된 이용권이 없습니다.</div>}
        </div>
      </div>
    </div>
  );
}

export default GymDetail; 