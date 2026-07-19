export type UserRole = 'ADMIN' | 'DONOR' | 'RECEIVER' | 'VOLUNTEER' | 'UNSET';

export type DonationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'FULFILLED' | 'CANCELLED';

export type FoodType = 'COOKED' | 'RAW' | 'FROZEN' | 'PACKAGED';

export interface AuthUser {
  id?: string;
  _id?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  role?: UserRole;
  avatar_url?: string;
}

export interface AdminUser {
  _id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  avatar_url?: string;
  role?: UserRole;
  points?: number;
  is_phone_verified?: boolean;
  is_email_verified?: boolean;
  is_active?: boolean;
  profile_completed?: boolean;
  avg_rating?: number | null;
  rating_count?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DonationRecord {
  _id: string;
  title?: string;
  description?: string;
  donor_id?: { _id?: string; full_name?: string; avatar_url?: string };
  volunteer_id?: { _id?: string; full_name?: string } | null;
  selected_receiver_id?: string | null;
  food_type?: FoodType;
  quantity?: number;
  unit?: string;
  images?: string[];
  status?: DonationStatus;
  cancel_reason?: CancelReason | null;
  cancelled_at?: string | null;
  delivery_type?: string | null;
  expiration_datetime?: string;
  pickup_address_line?: string | null;
  pickup_city?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CancelReason =
  | 'DONOR_CANCELLED'
  | 'DONOR_RELEASED'
  | 'RECEIVER_DISCONNECTED'
  | 'VOLUNTEER_NO_SHOW'
  | 'AUTO_NO_SHOW';

export interface RequestRecord {
  _id: string;
  title?: string;
  description?: string;
  receiver_id?: { _id?: string; full_name?: string; avatar_url?: string };
  food_type?: FoodType;
  requested_quantity?: number;
  unit?: string;
  needed_before?: string | null;
  status?: RequestStatus;
  accepted_by_donor_id?: string | null;
  linked_donation_id?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedbackRecord {
  _id: string;
  from_user_id?: { _id?: string; full_name?: string; avatar_url?: string; role?: UserRole };
  to_user_id?: { _id?: string; full_name?: string; avatar_url?: string; role?: UserRole };
  delivery_id?: string;
  rating?: number;
  comment?: string | null;
  createdAt?: string;
}

export type ReportReason =
  | 'SPOILED'
  | 'EXPIRED_UNSAFE'
  | 'WRONG_INFO'
  | 'FRAUD'
  | 'INAPPROPRIATE'
  | 'VOLUNTEER_NO_SHOW'
  | 'OTHER';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export type ReportAction = 'NONE' | 'WARN' | 'LOCK_USER' | 'REMOVE_DONATION';

export interface ReportRecord {
  _id: string;
  reporter_id?: { _id?: string; full_name?: string; avatar_url?: string; role?: UserRole };
  reported_user_id?: { _id?: string; full_name?: string; avatar_url?: string; role?: UserRole; is_active?: boolean } | null;
  donation_id?: { _id?: string; title?: string; status?: DonationStatus; food_type?: FoodType } | null;
  reason?: ReportReason;
  description?: string | null;
  status?: ReportStatus;
  admin_note?: string | null;
  action_taken?: ReportAction;
  resolved_at?: string | null;
  createdAt?: string;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  accessToken?: string;
  user?: AuthUser;
}
