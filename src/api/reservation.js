import { api } from './http';

export function createTrainerReservation({ gymId, trainerId, reservationDate, reservationTime }) {
  return api.post(`/gyms/${gymId}/trainers/${trainerId}/reservations`, {
    reservationDate,
    reservationTime,
  });
}

export function getMyReservations() {
  return api.get('/users/reservations');
}

export function getTrainerReservations({ gymId, trainerId }) {
  return api.get(`/gyms/${gymId}/trainers/${trainerId}/reservations`);
}

export function getTrainerDetail({ gymId, trainerId }) {
  return api.get(`/gyms/${gymId}/trainers/${trainerId}`);
} 