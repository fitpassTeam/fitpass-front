export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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