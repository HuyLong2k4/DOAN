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
  verification_document_type?: string;
  verification_document_url?: string;
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

export interface NearbyNgoItem {
  id: string;
  name: string;
  address_line: string;
  pin_code?: string | null;
  city: string;
  avatar_url?: string | null;
  points?: number;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
}

export interface NearbyNgosResponse {
  success: boolean;
  data: {
    ngos: NearbyNgoItem[];
    requester_has_location: boolean;
  };
}

// UI: Home — lấy thông tin user + profile
export const getMyProfile = (): Promise<AxiosResponse<MyProfileResponse>> =>
  http.get('/profile/me');

// UI: Donor Home — NGOs Near You
export const getNearbyNgos = (limit = 8): Promise<AxiosResponse<NearbyNgosResponse>> =>
  http.get(`/profile/ngos-nearby?limit=${limit}`);

// UI: Donor Details form
export const completeDonorProfile = (data: DonorProfileRequest): Promise<AxiosResponse<ProfileResponse>> =>
  http.post('/profile/donor', data);

// UI: Receiver Details form
export const completeReceiverProfile = (data: ReceiverProfileRequest): Promise<AxiosResponse<ProfileResponse>> =>
  http.post('/profile/receiver', data);

// UI: Volunteer Details form
export const completeVolunteerProfile = (data: VolunteerProfileRequest): Promise<AxiosResponse<ProfileResponse>> =>
  http.post('/profile/volunteer', data);

// UI: Pin Location by map / Set Location
export const updateLocation = (
  latitude: number,
  longitude: number,
): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
  http.patch('/profile/location', { latitude, longitude });
