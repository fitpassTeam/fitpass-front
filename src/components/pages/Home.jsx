import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGyms, getSearchGyms, toggleLikeGym } from '../../api/gyms';
import SearchBar from '../SearchBar';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import gymImg from '../../assets/헬스장.png';

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

    const handleLike = async (gymId) => {
        try {
            await toggleLikeGym(gymId);
            queryClient.invalidateQueries(['gyms']);
        } catch (e) {
            alert('좋아요 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <div>
            <div className="flex justify-center mb-4">
                <div className="w-full max-w-xl">
                    <SearchBar
                        searchText={searchText}
                        onSearch={val => {
                            setSearchText(val);
                            setPage(0);
                        }}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 왼쪽: 체육관 리스트 (2/3) */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {isLoading && <div className="col-span-2">로딩 중...</div>}
                        {isError && <div className="col-span-2">에러가 발생했습니다.</div>}
                        {gyms.length === 0 && !isLoading && <div className="col-span-2">체육관이 없습니다.</div>}
                        {gyms.map(gym => (
                            <div key={gym.gymId} className="border rounded p-3 h-24 flex gap-3 items-center bg-blue-100 relative">
                                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 flex items-center justify-center overflow-hidden rounded">
                                    {gym.gymImage && gym.gymImage.length > 0 ? (
                                        <img src={gym.gymImage[0]} alt={gym.name} className="object-cover w-full h-full" />
                                    ) : (
                                        <span>이미지 없음</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-base font-bold truncate">{gym.name}</div>
                                    <div className="text-gray-600 text-sm truncate">{gym.address}</div>
                                    <div className="text-xs text-gray-500 truncate">{gym.content}</div>
                                    <div className="text-xs text-gray-500 mt-1">운영시간: {formatTime(gym.openTime)} ~ {formatTime(gym.closeTime)}</div>
                                </div>
                                <button
                                    className="absolute top-2 right-2 text-xl focus:outline-none"
                                    onClick={() => handleLike(gym.gymId)}
                                    aria-label="좋아요"
                                >
                                    {gym.isLiked ? (
                                        <FaHeart className="text-red-500" />
                                    ) : (
                                        <FaRegHeart className="text-gray-400" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* 페이지네이션 */}
                    <div className="flex justify-center mt-6 gap-2">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 0}
                            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                        >
                            이전
                        </button>
                        <span className="px-2">{page + 1} / {totalPages}</span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page + 1 >= totalPages}
                            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                        >
                            다음
                        </button>
                    </div>
                </div>
                {/* 오른쪽: 내 목표 영역 (로그인 상태에서만 표시, 로그아웃 시에는 이미지) */}
                {isLoggedIn ? (
                    <div className="bg-blue-50 rounded p-4 min-h-[400px] flex items-center justify-center">
                        <div className="text-lg font-bold mb-2">내 목표</div>
                        {/* 목표 내용은 추후 추가 */}
                    </div>
                ) : (
                    <div className="bg-blue-50 rounded p-4 min-h-[400px] flex items-center justify-center">
                        <img
                            src={gymImg}
                            alt="헬스장 이미지"
                            className="w-full h-[350px] object-cover rounded"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;