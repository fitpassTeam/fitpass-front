import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkPassword, api } from '../../api/http';

function PasswordCheckPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 디버깅: 토큰 상태 확인 useEffect 제거
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
    // 소셜 로그인 사용자는 비밀번호 확인 생략
    api.get('/users/me').then(res => {
      const user = res.data?.data;
      if (user?.authProvider && user.authProvider !== 'LOCAL') {
        navigate('/edit-profile');
      }
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 디버깅: 요청 전 토큰 확인
    const token = localStorage.getItem('token');
    console.log('Token before request:', token);

    try {
      await checkPassword(password);
      // 비밀번호 확인 성공 시 프로필 수정 페이지로 이동
      navigate('/edit-profile');
    } catch (error) {
      console.error('Password check error:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 422) {
        setError('비밀번호가 일치하지 않습니다.');
        // 로그아웃/이동 없음
      } else if (error.response?.status === 401) {
        setError('인증이 만료되었습니다. 다시 로그인 해주세요.');
        localStorage.removeItem('token');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.response?.status === 400) {
        setError('잘못된 요청입니다.');
      } else {
        setError('서버 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-xl flex flex-col gap-6 min-w-[340px]">
        <h2 className="text-2xl font-bold text-center mb-2">비밀번호 확인</h2>
        <input
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-3 outline-none"
          required
          disabled={isLoading}
        />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg shadow hover:from-pink-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? '확인 중...' : '확인'}
        </button>
      </form>
    </div>
  );
}

export default PasswordCheckPage; 