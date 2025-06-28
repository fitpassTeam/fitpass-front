import { api } from './http';
 
export function loginUser(formData) {
  return api.post('/auth/login', formData);
} 