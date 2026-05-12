export interface User {
  id: string;
  full_name:         string | null;
  email?:            string | null;
  phone_number?:     string | null;
  avatar_url?:       string | null;
  role:              'UNSET' | 'ADMIN' | 'DONOR' | 'RECEIVER' | 'VOLUNTEER';
  onboarding_step:   number;
  profile_completed: boolean;
  is_phone_verified: boolean;
  points:            number;
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  phone_number?: string;
  avatar_url?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
