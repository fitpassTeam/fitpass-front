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

export function getSearchGyms({ page = 0, size = 10, searchText = '' } = {}) {
  return api.get('/search/gyms/v1', {
    params: {
      page,
      size,
      keyword: searchText,
    },
  });
}

export function toggleLikeGym(gymId) {
  return api.post(`/gyms/${gymId}/like`);
} 