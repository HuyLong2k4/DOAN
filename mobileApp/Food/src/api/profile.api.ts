import type { AxiosResponse } from 'axios';
import { http } from './http';
import type { User } from '../types';

export interface DonorProfileRequest {
  donor_type: 'RESTAURANT' | 'BAKERY' | 'INDIVIDUAL';
  business_name?: string;
  contact_name?: string;
  email?: string;
  address_line: string;
  pin_code?: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface ReceiverProfileRequest {
  receiver_type: 'TRUST' | 'NGO' | 'INDIVIDUAL' | 'ORPHANAGE' | 'SHELTER';
  organization_name?: string;
  contact_name?: string;
  address_line: string;
  pin_code?: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface VolunteerProfileRequest {
  contact_name?: string;
  address_line: string;
  pin_code?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  vehicle_type?: string;
  vehicle_license?: string;
  availability_days?: string[];
  availability_time?: string;
  delivery_goal?: number;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface MyProfileResponse {
  success: boolean;
  data: {
    user: User;
    profile: any;
  };
}

export interface UpdateProfileLocationRequest {
  latitude: number;
  longitude: number;
}

export interface UpdateProfileLocationResponse {
  success: boolean;
  message: string;
  profile: any;
}

// UI: Home — lấy thông tin user + profile
export const getMyProfile = (): Promise<AxiosResponse<MyProfileResponse>> =>
  http.get('/profile/me');

export const updateProfileLocation = (
  data: UpdateProfileLocationRequest
): Promise<AxiosResponse<UpdateProfileLocationResponse>> =>
  http.patch('/profile/location', data);

// UI: Donor Details form
export const completeDonorProfile = (data: DonorProfileRequest): Promise<AxiosResponse<ProfileResponse>> =>
  http.post('/profile/donor', data);

// UI: Receiver Details form
export const completeReceiverProfile = (data: ReceiverProfileRequest): Promise<AxiosResponse<ProfileResponse>> =>
  http.post('/profile/receiver', data);

// UI: Volunteer Details form
export const completeVolunteerProfile = (data: VolunteerProfileRequest): Promise<AxiosResponse<ProfileResponse>> =>
  http.post('/profile/volunteer', data);

// UI: Đổi / chọn lại vai trò — reset role về UNSET, app tự đưa về màn Select Role
export const resetRole = (): Promise<AxiosResponse<ProfileResponse>> =>
  http.patch('/profile/reset-role');
