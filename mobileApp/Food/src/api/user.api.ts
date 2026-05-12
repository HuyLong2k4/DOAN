import { http } from "./http";
import type { AxiosResponse } from "axios";
import type {
  User,
  UpdateUserRequest,
  ChangePasswordRequest,
  ApiResponse,
} from "../types";

export const getUserById = (
  id: string
): Promise<AxiosResponse<ApiResponse<User>>> => {
  return http.get(`/users/${id}`);
};

export const updateUser = (
  id: string,
  data: UpdateUserRequest
): Promise<AxiosResponse<ApiResponse<User>>> => {
  return http.patch(`/users/${id}`, data);
};

export const changePassword = (
  id: string,
  data: ChangePasswordRequest
): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
  return http.patch(`/users/${id}/change-password`, data);
};

export const getLeaderboard = (
  limit = 20,
  role?: 'DONOR' | 'VOLUNTEER'
): Promise<AxiosResponse<{ success: boolean; data: Array<{ _id: string; full_name: string; phone_number?: string; avatar_url?: string; points: number; role: string }> }>> => {
  const query = new URLSearchParams({ limit: String(limit) });
  if (role) query.set('role', role);
  return http.get(`/users/leaderboard?${query.toString()}`);
};

export interface DonorStats     { donations: number; feedbackReceived: number; totalPortions: number; points: number; }
export interface VolunteerStats { deliveries: number; feedbackReceived: number; totalPortions: number; points: number; }
export interface ReceiverStats  { mealsReceived: number; ngosConnected: number; feedbackSent: number; totalPortions: number; }
export type UserStats = DonorStats | VolunteerStats | ReceiverStats | Record<string, never>;

export const getMyStats = (): Promise<AxiosResponse<ApiResponse<UserStats>>> => {
  return http.get('/users/me/stats');
};

export const uploadAvatar = (
  file: { uri: string; name: string; type: string }
): Promise<AxiosResponse<ApiResponse<User>>> => {
  const form = new FormData();
  // React Native FormData accepts { uri, name, type } objects.
  form.append('avatar', file as any);
  return http.post('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};