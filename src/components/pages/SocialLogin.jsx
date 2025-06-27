import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SocialLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const pureToken = token?.replace(/^Bearer\s/, '');
    if (pureToken) {
      localStorage.setItem('token', pureToken);
      window.dispatchEvent(new Event('storage'));
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    }
  }, [navigate]);

  return null;
};

export default SocialLogin; 