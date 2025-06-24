import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SocialLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const pureToken = token?.replace(/^Bearer\s/, ''); // Bearer 접두사 제거

    console.log('[소셜로그인] 쿼리스트링:', window.location.search);
    console.log('[소셜로그인] 파싱된 토큰:', token);
    console.log('[소셜로그인] Bearer 제거 후 토큰:', pureToken);

    if (pureToken) {
      localStorage.setItem('token', pureToken);
      window.dispatchEvent(new Event('storage'));
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    } else {
      // 무한루프 방지: 토큰 없으면 이동하지 않고 로그만 남김
      console.log('[소셜로그인] 토큰 없음, 이동하지 않음(무한루프 방지)');
    }
  }, [navigate]);

  return null;
};

export default SocialLogin; 