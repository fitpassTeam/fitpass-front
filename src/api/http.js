import axios from 'axios';

function create(baseURL, options) {
  const instance = axios.create({
    baseURL,
    ...options,
  });

  // 요청 인터셉터: 토큰이 있으면 Authorization 헤더에 추가
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
}

export const api = create(import.meta.env.VITE_API_BASE_URL); 