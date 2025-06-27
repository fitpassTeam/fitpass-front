import { api } from './http';

export function getMyPoint() {
  return api.get('/users/points');
}

// 관리자 기능 - 사용자 목록 조회
export function getUsers() {
  return api.get('/users');
}

// 관리자 기능 - 포인트 충전
export function chargeUserPoint(userId, amount) {
  return api.post(`/admin/users/${userId}/charge`, { amount });
}

// 관리자 기능 - 오너 권한 승인 대기 목록 조회
export function getPendingOwnerRequests() {
  return api.get('/admin/pending-owner-requests');
}

// 관리자 기능 - 오너 권한 승인
export function approveOwner(userId) {
  return api.patch(`/admin/approve-owner/${userId}`);
}

// 관리자 기능 - 오너 권한 거절
export function rejectOwner(userId) {
  return api.patch(`/admin/reject-owner/${userId}`);
}

// 관리자 기능 - 체육관 승인 대기 목록 조회
export function getPendingGymRequests() {
  return api.get('/admin/pending-gym-requests');
}

// 관리자 기능 - 체육관 승인
export function approveGym(gymId) {
  return api.patch(`/admin/approve-gym/${gymId}`);
}

// 관리자 기능 - 체육관 거절
export function rejectGym(gymId) {
  return api.patch(`/admin/reject-gym/${gymId}`);
}

// 오너 권한 신청
export function requestUpgradeToOwner() {
  return api.post('/users/me/upgrade-to-owner');
} 