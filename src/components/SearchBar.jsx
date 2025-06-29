import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import PropTypes from 'prop-types';

function SearchBar({ searchText = '', onSearch, logo }) {
  const [localSearchText, setLocalSearchText] = useState(searchText);

  // props로 받은 searchText가 바뀌면 localSearchText도 동기화
  useEffect(() => {
    setLocalSearchText(searchText);
  }, [searchText]);

  return (
    <div className="relative flex items-center w-full h-14 bg-white border-2 border-blue-400 rounded-full shadow-md px-2 flex-wrap sm:flex-nowrap">
      {/* 네이버 스타일: 왼쪽에 Fitpass 로고만 */}
      {logo && (
        <img src={logo} alt="fitpass logo" className="w-10 h-10 object-cover rounded-full mr-2 ml-1 sm:mr-3 sm:ml-2" />
      )}
      {/* 검색 입력창 */}
      <input
        type="text"
        placeholder="검색"
        className="flex-1 h-10 text-base pl-2 pr-2 sm:pl-4 sm:pr-4 rounded-full border-none focus:outline-none bg-transparent min-w-0"
        value={localSearchText}
        onChange={e => setLocalSearchText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onSearch(localSearchText);
          }
        }}
        aria-label="검색"
      />
      <button
        type="button"
        className="ml-1 sm:ml-2 h-10 px-3 sm:px-6 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-sm sm:text-base font-bold flex items-center gap-1 sm:gap-2 border-2 border-blue-400 focus:border-blue-500 min-w-[70px] sm:min-w-[100px]"
        onClick={() => onSearch(localSearchText)}
        style={{ whiteSpace: 'nowrap' }}
      >
        <FaSearch className="text-base sm:text-lg" /> 검색
      </button>
    </div>
  );
}

SearchBar.propTypes = {
  searchText: PropTypes.string,
  onSearch: PropTypes.func.isRequired,
  logo: PropTypes.string,
};

export default SearchBar; 

