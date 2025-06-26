import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import PropTypes from 'prop-types';

function SearchBar({ searchText = '', onSearch }) {
  const [localSearchText, setLocalSearchText] = useState(searchText);

  // props로 받은 searchText가 바뀌면 localSearchText도 동기화
  useEffect(() => {
    setLocalSearchText(searchText);
  }, [searchText]);

  return (
    <div className="relative w-full flex items-center">
      <FaSearch className="absolute left-3 text-gray-400 text-lg pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)' }} />
      <input
        type="text"
        placeholder="검색"
        className="w-full h-10 text-base pl-10 pr-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        className="ml-3 h-10 px-6 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-base font-semibold"
        onClick={() => onSearch(localSearchText)}
        style={{ whiteSpace: 'nowrap' }}
      >
        검색
      </button>
    </div>
  );
}

SearchBar.propTypes = {
  searchText: PropTypes.string,
  onSearch: PropTypes.func.isRequired,
};

export default SearchBar; 

