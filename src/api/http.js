import axios from 'axios';
import { API_BASE_URL } from '../api-config';

function create(baseURL = API_BASE_URL, options) {
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

  // 응답 인터셉터: 토큰 만료/서버 다운 시 자동 로그아웃 및 재발급
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      // 서버 다운 또는 네트워크 에러
      if (!error.response) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return Promise.reject(error);
      }
      const status = error.response.status;
      // accessToken 만료: 401 + refreshToken 있으면 재발급 시도
      if (status === 401 && !originalRequest._retry) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          originalRequest._retry = true;
          try {
            const res = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/reissue`,
              { refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            if (accessToken) {
              localStorage.setItem('token', accessToken.replace(/^Bearer\s/, ''));
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken.replace(/^Bearer\s/, ''));
              }
              // 원래 요청 재시도
              originalRequest.headers['Authorization'] = `Bearer ${accessToken.replace(/^Bearer\s/, '')}`;
              return instance(originalRequest);
            }
          } catch (refreshError) {
            // refreshToken도 만료/실패: 완전 로그아웃
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            return Promise.reject(refreshError);
          }
        } else {
          // refreshToken 없음: 로그아웃
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      // 기타 인증 에러(403 등)도 로그아웃
      if (status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

export const api = create(API_BASE_URL);

// 비밀번호 확인 API
export const checkPassword = async (password) => {
  const response = await api.post('/users/me/password-check', {
    password: password
  });
  return response.data;
}; 
