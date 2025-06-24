import { api } from './http';

export function signupUser(formData) {
  return api.post('/auth/signup', formData);
} 