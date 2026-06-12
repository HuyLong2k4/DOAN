import type { TranslationKey } from '../../../../src/i18n/translations';
import type { Donation } from '../../../../src/components/DonationPostCard';

export type TFn = (key: TranslationKey) => string;

export type ReceiverBrief = {
  _id: string;
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
};

export type DeliveryStatus =
  | 'WAITING_AGENT'
  | 'SELF_PICKUP_READY'
  | 'AGENT_ASSIGNED'
  | 'ON_THE_WAY'
  | 'AWAITING_CONFIRMATION'
  | 'DELIVERED'
  | 'CANCELLED';

export type DonorDonation = Donation & {
  selected_receiver_id?: ReceiverBrief | null;
  delivery_type?: 'VIA_AGENT' | 'SELF_PICKUP' | null;
  delivery_status?: DeliveryStatus | null;
};

export type ApprovedReceiverRequest = {
  donationId: string;
  donationTitle: string;
  receiver: ReceiverBrief;
  deliveryType: 'VIA_AGENT' | 'SELF_PICKUP' | null;
  deliveryStatus: DeliveryStatus | null;
};

export type ReceiverFoodRequest = {
  _id: string;
  title: string;
  requested_quantity?: number;
  unit?: string;
  needed_before?: string | null;
  status?: 'PENDING' | 'ACCEPTED' | 'FULFILLED' | 'CANCELLED';
  accepted_by_donor_id?: string | null;
  linked_donation_id?:
    | { _id?: string; title?: string; status?: string; delivery_type?: string }
    | string
    | null;
  receiver_id?:
    | { _id?: string; full_name?: string; avatar_url?: string }
    | string
    | null;
};
