import type { TranslationKey } from '../../../../src/i18n/translations';
import type { Donation } from '../../../../src/components/DonationPostCard';

export type TFn = (key: TranslationKey) => string;

export type ReceiverBrief = {
  _id: string;
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
};

export type DonorDonation = Donation & {
  selected_receiver_id?: ReceiverBrief | null;
  delivery_type?: 'VIA_AGENT' | 'SELF_PICKUP' | null;
};

export type ApprovedReceiverRequest = {
  donationId: string;
  donationTitle: string;
  receiver: ReceiverBrief;
  deliveryType: 'VIA_AGENT' | 'SELF_PICKUP' | null;
};

export type ReceiverFoodRequest = {
  _id: string;
  title: string;
  requested_quantity?: number;
  unit?: string;
  food_preference?: 'VEG' | 'NON_VEG' | 'BOTH';
  needed_before?: string | null;
  receiver_id?:
    | { _id?: string; full_name?: string; avatar_url?: string }
    | string
    | null;
};
