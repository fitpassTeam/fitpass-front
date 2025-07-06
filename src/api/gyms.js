import { api } from './http';

export function getGyms({ page = 0, size = 10, searchText = '' } = {}) {
  return api.get('/gyms', {
    params: {
      page,
      size,
      searchText,
    },
  });
}

export function getSearchGyms({ page = 0, size = 10, keyword, city, district } = {}) {
  const params = {};
  if (page !== undefined) params.page = page;
  if (size !== undefined) params.size = size;
  if (keyword && keyword !== 'null' && keyword !== '') params.keyword = keyword;
  if (city && city !== 'null' && city !== '') params.city = city;
  if (district && district !== 'null' && district !== '') params.district = district;
  return api.get('/search/gyms', {
    params,
  });
}

export function toggleLikeGym(gymId) {
  return api.post(`/gyms/${gymId}/like`);
}

export function registerGym(formData) {
  const token = localStorage.getItem('token');
  return api.post('/gyms', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getMyGyms() {
  const token = localStorage.getItem('token');
  return api.get('/users/me/gyms', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateGym(gymId, formData) {
  const token = localStorage.getItem('token');
  return api.patch(`/gyms/${gymId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function deleteGym(gymId) {
  const token = localStorage.getItem('token');
  return api.delete(`/gyms/${gymId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getPopularGyms() {
  return api.get('/search/gyms/popular');
} 