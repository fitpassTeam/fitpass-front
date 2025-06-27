import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGyms, getSearchGyms, toggleLikeGym } from '../../api/gyms';
import SearchBar from '../SearchBar';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import '../../index.css'; // Tailwind custom keyframes 적용을 위해
import addressData from '../../assets/addressData';
import { useNavigate } from 'react-router-dom';

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

    let gyms = [];
    if (data?.data?.content) {
      gyms = data.data.content;
    } else if (data?.content) {
      gyms = data.content;
    }

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
    React.useEffect(() => {
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
        <div className="max-w-7xl mx-auto px-2 py-8">
            {/* 상단: 검색바 */}
            <div className="flex justify-center mb-8 w-full">
                <div className="w-full max-w-2xl flex gap-2 items-center justify-center">
                    <SearchBar
                        searchText={searchText}
                        onSearch={val => handleSearch(val, draftCity, draftDistrict)}
                    />
                    <select
                        name="city"
                        value={draftCity}
                        onChange={handleCityChange}
                        className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-3 py-2 outline-none min-w-[120px]"
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
                        className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-3 py-2 outline-none min-w-[120px]"
                        disabled={!draftCity}
                    >
                        <option value="">시/군/구</option>
                        {districts.map(district => (
                            <option key={district} value={district}>{district}</option>
                        ))}
                    </select>
                </div>
            </div>
            {/* 중단: 본문 그리드 (3등분) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 왼쪽: 체육관 리스트 (col-span-2) */}
                <div className="lg:col-span-2 col-span-1">
                    <div className="grid grid-cols-1 gap-8">
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
                                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-8 min-h-[220px] flex gap-10 items-center relative group cursor-pointer"
                                onClick={() => navigate(`/gyms/${gym.gymId}`)}
                            >
                                <div className="flex-shrink-0 w-40 h-40 bg-gray-100 flex items-center justify-center overflow-hidden rounded-xl">
                                    {gym.gymImage && gym.gymImage.length > 0 ? (
                                        <img src={gym.gymImage[0]} alt={gym.name} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="text-base text-gray-400">이미지 없음</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col gap-1 font-pretendard">
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
                </div>
                {/* 오른쪽: 실시간 인기 + 광고 (col-span-1, 세로로 쌓임) */}
                <div className="lg:col-span-1 col-span-1 flex flex-col gap-8">
                  {/* 실시간 인기 체육관 */}
                  <div className="bg-white/90 rounded-2xl shadow-md flex flex-col items-center justify-center min-h-[200px] p-6">
                    <div className="text-xl font-bold mb-3 text-purple-600">실시간 인기 체육관</div>
                    <ul className="w-full space-y-2">
                      {hotGyms.map((gym, idx) => (
                        <li
                          key={gym}
                          className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all
                            ${highlightIdx === idx ? 'bg-gradient-to-r from-pink-100 to-blue-100 text-blue-700 scale-105 shadow' : 'bg-gray-50 text-gray-700'}`}
                        >
                          <span className="text-base">{idx + 1}.</span> {gym}
                        </li>
                      ))}
                    </ul>
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