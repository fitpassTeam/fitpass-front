// 환경변수에서 API BASE URL을 불러옵니다. (Vite 환경)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function socialLogin(provider) {
  if (provider === 'naver') {
    const frontendUrl = window.location.protocol + '//' + window.location.host + '/sociallogin';
    window.location.href =
      API_BASE_URL +
      '/oauth2/authorization/' +
      provider +
      '?redirect_url=' +
      encodeURIComponent(frontendUrl);
  }
} 