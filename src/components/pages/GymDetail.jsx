import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getGyms } from '../../api/gyms';
// import Swiper 등 캐러셀 라이브러리 필요시 추가

function GymDetail() {
  const { gymId } = useParams();
  const [gym, setGym] = useState(null);
  const [tab, setTab] = useState('pass'); // 'pass' | 'post'
  const [mainIdx, setMainIdx] = useState(0); // 대표 이미지 인덱스

  useEffect(() => {
    async function fetchGym() {
      try {
        const res = await getGyms();
        const gyms = res.data?.data?.content || res.data?.content || [];
        const found = gyms.find(g => String(g.gymId) === String(gymId));
        if (found) {
          let gymImage = found.gymImage;
          if (typeof gymImage === 'string') {
            try { gymImage = JSON.parse(gymImage); } catch { gymImage = [gymImage]; }
          }
          setGym({ ...found, gymImage });
        } else {
          setGym(null);
        }
      } catch (err) {
        setGym(null);
      }
    }
    fetchGym();
  }, [gymId]);

  useEffect(() => { setMainIdx(0); }, [gym]);

  if (!gym) return <div className="text-center py-20 text-xl text-blue-400 animate-pulse">로딩 중...</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-2">
      <div className="flex flex-col md:flex-row gap-8 bg-white rounded-2xl shadow-lg p-8 mb-8">
        {/* 왼쪽: 사진 슬라이드 */}
        <div className="md:w-1/2 w-full flex flex-col items-center">
          <div className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
            {gym.gymImage && gym.gymImage.length > 0 ? (
              <img src={gym.gymImage[mainIdx]} alt="대표사진" className="object-cover w-full h-full transition-all duration-300" />
            ) : (
              <span className="text-gray-400">이미지 없음</span>
            )}
          </div>
          {/* 썸네일 리스트 */}
          <div className="flex gap-2 mt-3">
            {gym.gymImage && gym.gymImage.map((url, idx) => (
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
            <div className="text-3xl font-extrabold mb-2">{gym.name}</div>
            <div className="text-gray-600 mb-1">{gym.address}</div>
            <div className="text-blue-500 font-semibold mb-2">{gym.summary}</div>
            <div className="text-gray-700 mb-4">{gym.content}</div>
            <div className="text-sm text-gray-500">운영시간: {gym.openTime} ~ {gym.closeTime}</div>
          </div>
          <button className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold shadow hover:from-pink-500 hover:to-blue-500 transition-all">
            문의하기
          </button>
        </div>
      </div>
      {/* 하단 탭 */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-6 py-2 rounded-full font-bold text-lg shadow ${tab === 'pass' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setTab('pass')}
        >
          이용권 및 PT
        </button>
        <button
          className={`px-6 py-2 rounded-full font-bold text-lg shadow ${tab === 'post' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setTab('post')}
        >
          게시글
        </button>
      </div>
      {/* 탭 내용 */}
      {tab === 'pass' ? (
        <div className="bg-white rounded-2xl shadow p-8 min-h-[200px] flex flex-col gap-4">
          {/* TODO: 이용권/PT 리스트, 구매/예약 버튼 */}
          <div className="text-gray-400 text-center">이용권 및 PT 리스트 영역 (구현 예정)</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow p-8 min-h-[200px] flex flex-col gap-4">
          {/* TODO: 게시글 리스트, 오너만 작성 버튼 */}
          <div className="text-gray-400 text-center">게시글 리스트 영역 (구현 예정)</div>
        </div>
      )}
    </div>
  );
}

export default GymDetail; 