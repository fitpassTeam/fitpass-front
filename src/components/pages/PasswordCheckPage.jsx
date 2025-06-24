import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 임시: 실제 비밀번호는 백엔드에서 검증해야 함
const mockUser = {
  password: '1234', // 실제로는 저장 X, 예시용
};

function PasswordCheckPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // TODO: 실제로는 API로 비밀번호 검증
    if (password === mockUser.password) {
      navigate('/edit-profile');
    } else {
      setError('비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-xl flex flex-col gap-6 min-w-[340px]">
        <h2 className="text-2xl font-bold text-center mb-2">비밀번호 확인</h2>
        <input
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 outline-none"
          required
        />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg shadow hover:from-pink-500 hover:to-blue-500 transition-all"
        >
          확인
        </button>
      </form>
    </div>
  );
}

export default PasswordCheckPage; 