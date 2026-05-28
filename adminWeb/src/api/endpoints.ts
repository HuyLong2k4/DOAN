import type { AdminUser, ApiEnvelope, AuthUser, DonationRecord, FeedbackRecord, RequestRecord, VerificationStatus, VolunteerRecord } from '../types';
import { buildClient, getActiveClient, type ApiClient } from './client';

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(baseUrl: string, payload: LoginPayload): Promise<LoginResponse> {
  const tempClient: ApiClient = buildClient(baseUrl);
  const res = await tempClient.post<ApiEnvelope<unknown>>('/auth/login', payload);
  const data = res.data;

  if (!data.user || !data.accessToken) {
    throw new Error('Phản hồi đăng nhập không hợp lệ.');
  }

  if (data.user.role !== 'ADMIN') {
    throw new Error('Tài khoản này không có quyền ADMIN.');
  }

  return { accessToken: data.accessToken, user: data.user };
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await getActiveClient().get<ApiEnvelope<AdminUser[]>>('/users');
  return res.data.data || [];
}

export async function updateUser(id: string, payload: Partial<AdminUser>): Promise<AdminUser | null> {
  const res = await getActiveClient().patch<ApiEnvelope<AdminUser>>(`/users/${id}`, payload);
  return res.data.data || null;
}

export async function deleteUser(id: string): Promise<void> {
  await getActiveClient().delete<ApiEnvelope<unknown>>(`/users/${id}`);
}

export async function changeOwnPassword(
  id: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  await getActiveClient().patch<ApiEnvelope<unknown>>(`/users/${id}/change-password`, {
    oldPassword,
    newPassword,
  });
}

export async function logoutSession(): Promise<void> {
  // Báo server tăng token_version để vô hiệu hoá JWT đã phát hành.
  await getActiveClient().post<ApiEnvelope<unknown>>('/auth/logout');
}

export async function listDonations(status?: string): Promise<DonationRecord[]> {
  const params = status ? { status } : undefined;
  const res = await getActiveClient().get<ApiEnvelope<DonationRecord[]>>('/food-donations', { params });
  return res.data.data || [];
}

export async function listRequests(status?: string): Promise<RequestRecord[]> {
  const params = status ? { status } : undefined;
  const res = await getActiveClient().get<ApiEnvelope<RequestRecord[]>>('/food-requests', { params });
  return res.data.data || [];
}

export async function listVolunteers(): Promise<VolunteerRecord[]> {
  const res = await getActiveClient().get<ApiEnvelope<VolunteerRecord[]>>('/profile/volunteers');
  return res.data.data || [];
}

export async function updateVerificationStatus(userId: string, status: VerificationStatus): Promise<void> {
  await getActiveClient().patch<ApiEnvelope<unknown>>(`/profile/volunteers/${userId}/verification`, { status });
}

export async function listFeedback(): Promise<FeedbackRecord[]> {
  const res = await getActiveClient().get<ApiEnvelope<FeedbackRecord[]>>('/feedback');
  return res.data.data || [];
}
