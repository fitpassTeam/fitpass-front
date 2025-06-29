import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGyms, getSearchGyms, toggleLikeGym, getPopularGyms } from '../../api/gyms';
import SearchBar from '../SearchBar';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import '../../index.css'; // Tailwind custom keyframes 적용을 위해
import addressData from '../../assets/addressData';
import { useNavigate } from 'react-router-dom';
import { useQuery as useQueryPopular } from '@tanstack/react-query';
import logo from '../../assets/logo.jpg';

function formatTime(timeStr) {
    // '06:00:00' -> '06:00'
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
}

function Home() {
    // draft 상태: 입력값만 관리
    // const [draftSearchText, setDraftSearchText] = useState('');
    const [draftCity, setDraftCity] = useState('');
    const [draftDistrict, setDraftDistrict] = useState('');
    // 실제 검색에 사용되는 상태
    const [searchText, setSearchText] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [page, setPage] = useState(0);
    const queryClient = useQueryClient();
    const isLoggedIn = !!localStorage.getItem('token');
    const navigate = useNavigate();

    // 드롭다운 데이터
    const cities = Object.keys(addressData);
    const districts = draftCity ? addressData[draftCity] : [];

    // 검색 파라미터
    const searchParams = useMemo(() => ({
        page,
        size: 10,
        keyword: searchText ? searchText : undefined,
        city: selectedCity ? selectedCity : undefined,
        district: selectedDistrict ? selectedDistrict : undefined,
    }), [page, searchText, selectedCity, selectedDistrict]);
    const isSearch = useMemo(() => !!(searchParams.keyword || searchParams.city || searchParams.district), [searchParams]);

    // 검색/전체 API 분기
    const { data, isLoading, isError } = useQuery({
        queryKey: [
            'gyms',
            page,
            searchText || '',
            selectedCity || '',
            selectedDistrict || '',
            isSearch
        ],
        queryFn: () => {
            if (isSearch) {
                return getSearchGyms(searchParams).then(res => res.data.data);
            } else {
                return getGyms({ page, size: 10 }).then(res => res.data.data);
            }
        },
        keepPreviousData: true,
    });

    // 인기 체육관 API 호출
    const { data: popularGymsData, isLoading: isPopularLoading, isError: isPopularError } = useQueryPopular({
        queryKey: ['popularGyms'],
        queryFn: async () => {
            const res = await getPopularGyms();
            return res.data;
        },
        refetchOnWindowFocus: false,
    });
    // 인기 체육관 데이터 추출 (최대 5개)
    const popularGyms = Array.isArray(popularGymsData?.data) ? popularGymsData.data.slice(0, 5) : [];

    let gyms = [];
    if (data?.data?.content) {
      gyms = data.data.content;
    } else if (data?.content) {
      gyms = data.content;
    }

    // 애니메이션 효과를 위한 인덱스
    const [highlightIdx, setHighlightIdx] = useState(0);

    // popularGyms가 바뀔 때만 0으로 리셋
    React.useEffect(() => {
        setHighlightIdx(0);
    }, [popularGyms.length]);

    // highlightIdx 애니메이션 순환
    React.useEffect(() => {
        if (!popularGyms.length) return;
        const interval = setInterval(() => {
            setHighlightIdx(idx => (idx + 1) % popularGyms.length);
        }, 1800);
        return () => clearInterval(interval);
    }, [popularGyms.length]);

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

    // 검색 버튼 클릭 시에만 실제 검색 실행
    const handleSearch = (val, city, district) => {
        setSearchText(val !== undefined ? val : searchText);
        setSelectedCity(city !== undefined ? city : selectedCity);
        setSelectedDistrict(district !== undefined ? district : selectedDistrict);
        setPage(0);
    };
    // 드롭다운/검색바는 draft만 변경
    const handleCityChange = (e) => {
        const city = e.target.value;
        setDraftCity(city);
        setDraftDistrict('');
        setSelectedCity(city);
        setSelectedDistrict('');
        setPage(0);
    };
    const handleDistrictChange = (e) => {
        const district = e.target.value;
        setDraftDistrict(district);
        setSelectedDistrict(district);
        setPage(0);
    };

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
            {/* 상단: 검색바 */}
            <div className="flex flex-col sm:flex-row justify-center mb-8 w-full gap-2">
                <div className="w-full flex flex-row gap-2 items-center justify-center">
                    <SearchBar
                        searchText={searchText}
                        onSearch={val => handleSearch(val, draftCity, draftDistrict)}
                        logo={logo}
                    />
                    <select
                        name="city"
                        value={draftCity}
                        onChange={handleCityChange}
                        className="border-2 border-blue-400 focus:border-blue-500 bg-white rounded-full px-3 py-2 outline-none min-w-[120px] w-auto h-14 text-base font-semibold"
                        style={{ marginLeft: 8 }}
                    >
                        <option value="">시/도</option>
                        {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                    <select
                        name="district"
                        value={draftDistrict}
                        onChange={handleDistrictChange}
                        className="border-2 border-blue-400 focus:border-blue-500 bg-white rounded-full px-3 py-2 outline-none min-w-[120px] w-auto h-14 text-base font-semibold"
                        style={{ marginLeft: 8 }}
                        disabled={!draftCity}
                    >
                        <option value="">시/군/구</option>
                        {districts.map(district => (
                            <option key={district} value={district}>{district}</option>
                        ))}
                    </select>
                </div>
            </div>
            {/* 중단: 본문 그리드 (반응형) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 왼쪽: 체육관 리스트 (col-span-2) */}
                <div className="md:col-span-2 col-span-1">
                    <div className="grid grid-cols-1 gap-6">
                        {isLoading && (
                            <div className="col-span-1 flex flex-col items-center py-16 text-blue-400 animate-pulse">
                                <span className="text-2xl font-bold">로딩 중...</span>
                            </div>
                        )}
                        {isError ? (
                            <div className="col-span-1 flex flex-col items-center py-16 text-red-400">
                                <span className="text-2xl font-bold">에러가 발생했습니다.</span>
                            </div>
                        ) : gyms.length === 0 && !isLoading ? (
                            <div className="col-span-1 flex flex-col items-center py-16 text-gray-400">
                                <span className="text-2xl font-bold">체육관이 없습니다.</span>
                            </div>
                        ) : null}
                        {gyms.map(gym => (
                            <div
                                key={gym.gymId}
                                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-4 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-10 items-center relative group cursor-pointer"
                                onClick={() => navigate(`/gyms/${gym.gymId}`)}
                            >
                                <div className="flex-shrink-0 w-full sm:w-40 h-40 bg-gray-100 flex items-center justify-center overflow-hidden rounded-xl">
                                    {gym.gymImage && gym.gymImage.length > 0 ? (
                                        <img src={gym.gymImage[0]} alt={gym.name} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="text-base text-gray-400">이미지 없음</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                    <div className="text-lg font-medium text-gray-900 leading-tight mb-0.5">{gym.name}</div>
                                    <div className="text-sm text-gray-500 font-normal mb-0.5">{gym.address}</div>
                                    <div className="text-xs text-gray-400 font-light mb-0.5">운영시간: {formatTime(gym.openTime)} ~ {formatTime(gym.closeTime)}</div>
                                    {gym.summary && (
                                      <div className="text-xs text-blue-500 font-medium mt-1">{gym.summary}</div>
                                    )}
                                </div>
                                <button
                                    className={`absolute top-5 right-5 text-3xl transition-transform duration-150 ${gym.isLiked ? 'scale-110' : 'scale-100'}`}
                                    onClick={e => { e.stopPropagation(); handleLike(gym.gymId); }}
                                >
                                    {gym.isLiked ? <FaHeart className="text-pink-500" /> : <FaRegHeart className="text-gray-300" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                {/* 오른쪽: 인기 체육관 등 */}
                <div className="col-span-1 flex flex-col gap-6">
                  {/* 인기 체육관, 광고 등 여기에 반응형으로 배치 */}
                  {/* 인기 체육관 */}
                  <div className="bg-white/90 rounded-2xl shadow-md flex flex-col items-center justify-center min-h-[200px] p-6">
                    <div className="text-xl font-bold mb-3 text-purple-600">인기 체육관</div>
                    {isPopularLoading ? (
                      <div className="text-gray-400">로딩 중...</div>
                    ) : isPopularError ? (
                      <div className="text-red-400">에러가 발생했습니다.</div>
                    ) : popularGyms.length === 0 ? (
                      <div className="text-gray-400">인기 체육관 데이터가 없습니다.</div>
                    ) : (
                      <ul className="w-full space-y-2">
                        {popularGyms.map((gym, idx) => (
                          <li
                            key={gym}
                            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all
                              ${highlightIdx === idx ? 'bg-gradient-to-r from-pink-100 to-blue-100 text-blue-700 scale-105 shadow' : 'bg-gray-50 text-gray-700'}`}
                          >
                            <span className="text-base">{idx + 1}.</span> {gym}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* 헬스용품 추천 광고 (흰색 배경) */}
                  <div className="bg-white rounded-2xl shadow-md flex flex-col items-center justify-center min-h-[200px] p-6">
                    <a
                      href="https://atemshop.com/product/list.html?cate_no=446&cafe_mkt=google_aw&utm_source=google&utm_medium=cpc&utm_campaign=h_conversions-brand&utm_term=&utm_content=250604_HEVENT_G_event_all_brand_home_egc&gad_source=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full max-w-xs"
                    >
                      <img
                        src="https://images.pexels.com/photos/5938366/pexels-photo-5938366.jpeg?auto=compress&w=400"
                        alt="헬스용품 추천"
                        className="w-full rounded-xl shadow-lg mb-3 border-2 border-blue-200"
                      />
                    </a>
                    <div className="text-lg font-bold text-blue-600 mb-1">헬스식품/닭가슴살 추천</div>
                    <div className="text-gray-600 text-sm mb-3">단백질 간편식, 닭가슴살, 건강식품을 한눈에!</div>
                    <a
                      href="https://atemshop.com/product/list.html?cate_no=446&cafe_mkt=google_aw&utm_source=google&utm_medium=cpc&utm_campaign=h_conversions-brand&utm_term=&utm_content=250604_HEVENT_G_event_all_brand_home_egc&gad_source=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-full shadow hover:scale-105 transition text-center"
                    >
                      에잇템 헬스식품 바로가기
                    </a>
                  </div>
                </div>
            </div>
        </div>
    );
}

export default Home;