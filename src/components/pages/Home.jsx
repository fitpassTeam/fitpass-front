import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGyms, getSearchGyms, toggleLikeGym } from '../../api/gyms';
import SearchBar from '../SearchBar';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import '../../index.css'; // Tailwind custom keyframes 적용을 위해

function formatTime(timeStr) {
    // '06:00:00' -> '06:00'
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
}

function Home() {
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(0);
    const queryClient = useQueryClient();
    const isLoggedIn = !!localStorage.getItem('token');

    const { data, isLoading, isError } = useQuery({
        queryKey: ['gyms', { page, searchText }],
        queryFn: () => {
            if (searchText) {
                return getSearchGyms({ page, size: 10, searchText }).then(res => res.data.data);
            } else {
                // searchText 파라미터를 undefined로 보내서 불필요한 빈값 전달 방지
                return getGyms({ page, size: 10, searchText: undefined }).then(res => res.data.data);
            }
        },
        keepPreviousData: true,
    });

    const gyms = data?.content || [];
    const totalPages = data?.totalPages || 1;

    // 실시간 인기 검색어(임시 데이터, 실제 API 연동 가능)
    const [hotGyms] = useState([
        '강남 피트니스',
        '홍대 바디짐',
        '부산 헬스존',
        '대구 PT스튜디오',
        '신촌 크로스핏'
    ]);
    // 애니메이션 효과를 위한 인덱스
    const [highlightIdx, setHighlightIdx] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setHighlightIdx(idx => (idx + 1) % hotGyms.length);
        }, 1800);
        return () => clearInterval(interval);
    }, [hotGyms.length]);

    const handleLike = async (gymId) => {
        if (!isLoggedIn) {
            alert('로그인해야 가능합니다.');
            return;
        }
        try {
            await toggleLikeGym(gymId);
            queryClient.invalidateQueries(['gyms']);
        } catch (e) {
            alert('좋아요 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-2 py-8">
            {/* 검색바 */}
            <div className="flex justify-center mb-8">
                <div className="w-full max-w-2xl">
                    <SearchBar
                        searchText={searchText}
                        onSearch={val => {
                            setSearchText(val);
                            setPage(0);
                        }}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* 체육관 리스트 */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {isLoading && (
                            <div className="col-span-2 flex flex-col items-center py-16 text-blue-400 animate-pulse">
                                <span className="text-2xl font-bold">로딩 중...</span>
                            </div>
                        )}
                        {isError && (
                            <div className="col-span-2 flex flex-col items-center py-16 text-red-400">
                                <span className="text-2xl font-bold">에러가 발생했습니다.</span>
                            </div>
                        )}
                        {gyms.length === 0 && !isLoading && (
                            <div className="col-span-2 flex flex-col items-center py-16 text-gray-400">
                                <span className="text-2xl font-bold">체육관이 없습니다.</span>
                            </div>
                        )}
                        {gyms.map(gym => (
                            <div
                                key={gym.gymId}
                                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-4 flex gap-4 items-center relative group"
                            >
                                <div className="flex-shrink-0 w-20 h-20 bg-gray-100 flex items-center justify-center overflow-hidden rounded-xl border">
                                    {gym.gymImage && gym.gymImage.length > 0 ? (
                                        <img src={gym.gymImage[0]} alt={gym.name} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="text-xs text-gray-400">이미지 없음</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-lg font-bold truncate">{gym.name}</div>
                                    <div className="text-gray-600 text-sm truncate">{gym.address}</div>
                                    <div className="text-xs text-gray-500 truncate">{gym.content}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        운영시간: {formatTime(gym.openTime)} ~ {formatTime(gym.closeTime)}
                                    </div>
                                </div>
                                <button
                                    className={`absolute top-3 right-3 text-2xl transition-transform duration-150 ${gym.isLiked ? 'scale-110' : 'scale-100'}`}
                                    onClick={() => handleLike(gym.gymId)}
                                    aria-label="좋아요"
                                >
                                    {gym.isLiked ? (
                                        <FaHeart className="text-pink-500 drop-shadow" />
                                    ) : (
                                        <FaRegHeart className="text-gray-300 group-hover:text-pink-400 transition-colors" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* 페이지네이션 */}
                    <div className="flex justify-center mt-8 gap-2">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 0}
                            className="px-4 py-2 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-700 font-semibold disabled:opacity-50"
                        >
                            이전
                        </button>
                        <span className="px-4 py-2 text-lg font-bold text-blue-500">{page + 1} / {totalPages}</span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page + 1 >= totalPages}
                            className="px-4 py-2 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-700 font-semibold disabled:opacity-50"
                        >
                            다음
                        </button>
                    </div>
                </div>
                {/* 내 목표/서비스 소개 카드 */}
                <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-md flex flex-col items-center justify-center min-h-[400px] p-8 col-span-1">
                    {isLoggedIn ? (
                        <div className="flex flex-col items-center">
                            <div className="text-2xl font-bold mb-2 text-blue-600">내 목표</div>
                            <div className="text-gray-500">아직 목표가 없어요.<br />목표를 추가해보세요!</div>
                        </div>
                    ) : (
                        <>
                            <div className="text-2xl font-bold mb-4 text-blue-600">FitPass로 할 수 있는 것</div>
                            <ul className="space-y-3 text-gray-700 text-lg mb-6">
                                <li>✅ 전국 헬스장 실시간 검색</li>
                                <li>✅ 트레이너 정보/후기 확인</li>
                                <li>✅ 내 운동 목표 관리</li>
                                <li>✅ 실시간 예약</li>
                                <li>✅ 실시간 알림/소통</li>
                            </ul>
                            <div className="mt-2 text-center text-base text-gray-500 font-semibold">회원가입하고 더 많은 혜택을 누리세요!</div>
                            <button
                                className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-bold rounded-full shadow-lg hover:scale-105 transition-all duration-200"
                                onClick={() => window.location.href = '/signup'}
                            >
                                회원가입
                            </button>
                        </>
                    )}
                </div>
                {/* 실시간 인기 체육관 차트 */}
                <div className="bg-white/90 rounded-2xl shadow-md flex flex-col items-center justify-center min-h-[400px] p-8 col-span-1">
                    <div className="text-2xl font-bold mb-4 text-purple-600">실시간 인기 체육관</div>
                    <ul className="w-full space-y-3">
                        {hotGyms.map((gym, idx) => (
                            <li
                                key={gym}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-semibold transition-all duration-500 ${highlightIdx === idx ? 'bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 scale-105 shadow-lg text-purple-700' : 'text-gray-700'}`}
                                style={{ minHeight: 48 }}
                            >
                                <span className="font-bold text-xl text-blue-400">#{idx + 1}</span>
                                <span className="truncate">{gym}</span>
                                {highlightIdx === idx && (
                                    <span className="ml-auto animate-bounce text-pink-500 font-bold">🔥</span>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 text-xs text-gray-400">실제 인기 검색어/체육관은 추후 API 연동</div>
                </div>
            </div>
        </div>
    );
}

export default Home;