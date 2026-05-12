import type { AxiosResponse } from 'axios';
import { http } from './http';

export interface ReceiverFeedbackContextResponse {
  success: boolean;
  data: {
    donation_id: string;
    donation_title: string;
    delivery_id: string;
    can_feedback: boolean;
    is_completed: boolean;
    points_earned: number;
    donor: {
      id: string | null;
      full_name: string;
    };
    volunteer: {
      id: string;
      full_name: string;
    } | null;
    existing_feedback: {
      donor_rating: number | null;
      donor_comment: string;
      volunteer_rating: number | null;
      volunteer_comment: string;
    };
  };
}

export interface SubmitReceiverFeedbackPayload {
  donor_rating: number;
  donor_comment?: string;
  volunteer_rating?: number;
  volunteer_comment?: string;
}

export interface SubmitReceiverFeedbackResponse {
  success: boolean;
  message: string;
  donation_id: string;
  delivery_id: string;
}

export const getReceiverFeedbackContext = (
  donationId: string,
): Promise<AxiosResponse<ReceiverFeedbackContextResponse>> =>
  http.get(`/feedback/donation/${donationId}`);

export const submitReceiverFeedback = (
  donationId: string,
  payload: SubmitReceiverFeedbackPayload,
): Promise<AxiosResponse<SubmitReceiverFeedbackResponse>> =>
  http.post(`/feedback/donation/${donationId}`, payload);
