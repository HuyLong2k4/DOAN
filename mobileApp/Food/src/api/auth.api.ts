import type { AxiosResponse } from 'axios';
import type {
  SignupRequest, SignupResponse,
  VerifyOtpRequest, VerifyOtpResponse,
  ResendOtpRequest,
  LoginRequest, LoginResponse,
  ForgotPasswordRequest, ForgotPasswordResponse,
  ResetPasswordRequest, ResetPasswordResponse,
  SelectRoleRequest, SelectRoleResponse,
} from '../types';
import { http } from './http';

// UI: Sign Up Page
export const signup = (data: SignupRequest): Promise<AxiosResponse<SignupResponse>> =>
  http.post('/auth/signup', data);

// UI: OTP Screen
export const verifyOtp = (data: VerifyOtpRequest): Promise<AxiosResponse<VerifyOtpResponse>> =>
  http.post('/auth/verify-otp', data);

export const resendOtp = (data: ResendOtpRequest): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
  http.post('/auth/resend-otp', data);

// UI: Login Screen
export const login = (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> =>
  http.post('/auth/login', data);

// UI: Forgot Password
export const forgotPassword = (data: ForgotPasswordRequest): Promise<AxiosResponse<ForgotPasswordResponse>> =>
  http.post('/auth/forgot-password', data);

// UI: Reset Password
export const resetPassword = (data: ResetPasswordRequest): Promise<AxiosResponse<ResetPasswordResponse>> =>
  http.post('/auth/reset-password', data);

// UI: Select Profile (Donor/Receiver/Volunteer)
export const selectRole = (data: SelectRoleRequest): Promise<AxiosResponse<SelectRoleResponse>> =>
  http.post('/auth/select-role', data);

export const logout = (): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
  http.post('/auth/logout');
