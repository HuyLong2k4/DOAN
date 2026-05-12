import type { User } from './user.types';

// ── Sign Up ────────────────────────────────────────────────────────────────
export interface SignupRequest {
  full_name: string;
  phone_number: string;
  password: string;
  confirm_password: string;
}
export interface SignupResponse {
  success: boolean;
  message: string;
}

// ── OTP ───────────────────────────────────────────────────────────────────
export type OtpPurpose = 'SIGNUP' | 'RESET_PASSWORD';

export interface VerifyOtpRequest {
  phone_number: string;
  otp: string;
  purpose: OtpPurpose;
}
export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  // purpose=SIGNUP
  accessToken?: string;
  user?: User;
  // purpose=RESET_PASSWORD
  reset_token?: string;
}

export interface ResendOtpRequest {
  phone_number: string;
  purpose: OtpPurpose;
}

// ── Login ─────────────────────────────────────────────────────────────────
export interface LoginRequest {
  identifier: string;   // phone_number hoặc email
  password: string;
}
export interface LoginResponse {
  success: boolean;
  accessToken: string;
  user: User;
}

// ── Forgot / Reset Password ───────────────────────────────────────────────
export interface ForgotPasswordRequest {
  identifier: string;
}
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  phone_number: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
  confirm_password: string;
}
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// ── Select Role ───────────────────────────────────────────────────────────
export type UserRole = 'DONOR' | 'RECEIVER' | 'VOLUNTEER';

export interface SelectRoleRequest  { role: UserRole; }
export interface SelectRoleResponse {
  success: boolean;
  message: string;
  user: User;
}

// ── Legacy aliases (giữ cho các file cũ khỏi bị lỗi) ─────────────────────
export interface RegisterRequest extends SignupRequest {}
export interface RegisterResponse extends SignupResponse {}
