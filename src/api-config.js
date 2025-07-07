// 환경변수에서 API BASE URL을 불러옵니다. (Vite 환경)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function socialLogin(provider) {
  // 운영 환경에서는 백엔드 서버 도메인으로 직접 이동
  // 예: https://api.fitpass-13.com/oauth2/authorization/naver
  // 개발 환경(localhost)에서는 기존대로 API_BASE_URL 사용
  let backendBaseUrl = API_BASE_URL;
  if (window.location.hostname === 'www.fitpass-13.com') {
    backendBaseUrl = 'https://api.fitpass-13.com'; // 실제 백엔드 도메인으로 수정
  }
  window.location.href = backendBaseUrl + '/oauth2/authorization/' + provider;
} 