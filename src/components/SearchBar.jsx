import { useState, useEffect, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { api } from '../api/http';

function SearchSuggestions({ showDropdown, suggestions, onSelect }) {
  if (!showDropdown) return null;
  return (
    <ul className="absolute left-0 top-full mt-2 w-full bg-white border border-blue-200 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto animate-fadeIn">
      {suggestions.length === 0 ? (
        <li className="px-4 py-3 text-gray-400">추천 결과가 없습니다.</li>
      ) : (
        suggestions.map(item => (
          <li
            key={item.id}
            className="px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center gap-3"
            onClick={() => onSelect(item)}
          >
            {item.image && <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded-full border" />}
            <span className="font-semibold text-gray-800 truncate">{item.name}</span>
            {item.address && <span className="text-xs text-gray-400 ml-2 truncate">{item.address}</span>}
          </li>
        ))
      )}
    </ul>
  );
}

SearchSuggestions.propTypes = {
  showDropdown: PropTypes.bool.isRequired,
  suggestions: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function SearchBar({ searchText = '', onSearch, logo }) {
  const [localSearchText, setLocalSearchText] = useState(searchText);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef();

  // props로 받은 searchText가 바뀌면 localSearchText도 동기화
  useEffect(() => {
    setLocalSearchText(searchText);
  }, [searchText]);

  // 오토컴플리트 API 호출 (debounce)
  useEffect(() => {
    if (!localSearchText) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/search/gyms?keyword=${encodeURIComponent(localSearchText)}&size=10`);
        const list = Array.isArray(res.data?.data?.content) ? res.data.data.content : [];
        setSuggestions(list);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 250);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [localSearchText]);

  // 드롭다운 외부 클릭 시 닫기
  const wrapperRef = useRef();
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionSelect = (item) => {
    setLocalSearchText(item.name);
    setShowDropdown(false);
    onSearch(item.name);
  };

  return (
    <div className="relative flex items-center w-full h-12 sm:h-14 bg-white border-2 border-blue-400 rounded-full shadow-md px-2 sm:px-3 flex-wrap sm:flex-nowrap min-w-0" ref={wrapperRef}>
      {/* 네이버 스타일: 왼쪽에 Fitpass 로고만 */}
      {logo && (
        <img src={logo} alt="fitpass logo" className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full mr-2 ml-1 sm:mr-3 sm:ml-2 flex-shrink-0" />
      )}
      {/* 검색 입력창 */}
      <input
        type="text"
        placeholder="검색"
        className="flex-1 h-8 sm:h-10 text-sm sm:text-base pl-2 pr-2 sm:pl-4 sm:pr-4 rounded-full border-none focus:outline-none bg-transparent min-w-0"
        value={localSearchText}
        onChange={e => { setLocalSearchText(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onSearch(localSearchText);
          }
        }}
        aria-label="검색"
        autoComplete="off"
      />
      <button
        type="button"
        className="ml-1 sm:ml-2 h-8 sm:h-10 px-2 sm:px-4 lg:px-6 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-xs sm:text-sm lg:text-base font-bold flex items-center gap-1 sm:gap-2 border-2 border-blue-400 focus:border-blue-500 min-w-[60px] sm:min-w-[80px] lg:min-w-[100px] flex-shrink-0"
        onClick={() => { onSearch(localSearchText); }}
        style={{ whiteSpace: 'nowrap' }}
      >
        <FaSearch className="text-xs sm:text-sm lg:text-base" /> 
        <span className="hidden sm:inline">검색</span>
      </button>
      <SearchSuggestions showDropdown={showDropdown} suggestions={suggestions} onSelect={handleSuggestionSelect} />
    </div>
  );
}

SearchBar.propTypes = {
  searchText: PropTypes.string,
  onSearch: PropTypes.func.isRequired,
  logo: PropTypes.string,
};

export default SearchBar; 

