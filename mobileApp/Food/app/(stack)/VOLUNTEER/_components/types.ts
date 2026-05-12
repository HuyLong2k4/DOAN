import type { TranslationKey } from '../../../../src/i18n/translations';

export type TFn = (key: TranslationKey) => string;

export type DeliveryRequest = {
  id: string;
  title: string;
  quantityLabel: string;
  address: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  isPreferredForYou?: boolean;
};

export type FoodDonationApiItem = {
  _id: string;
  title: string;
  quantity: number;
  unit: string;
  pickup_address_line?: string | null;
  pickup_city?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  is_preferred_for_you?: boolean;
};

export type VolunteerDeliveryApiItem = {
  id: string;
  title: string;
  quantity?: number;
  unit?: string;
  delivery_status?: 'AGENT_ASSIGNED' | 'ON_THE_WAY' | 'DELIVERED' | string | null;
  receiver?: { full_name?: string };
  pickup_address_line?: string | null;
  pickup_city?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
};

export type VolunteerDeliveryItem = {
  id: string;
  title: string;
  quantityLabel: string;
  receiverName: string;
  pickupAddress: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  deliveryStatus: 'AGENT_ASSIGNED' | 'ON_THE_WAY';
};

export type NearbyNgo = {
  id: string;
  name: string;
  distanceKm: number | null;
  points: number;
  address: string;
  popular?: boolean;
};

export type VolunteerSummary = {
  delivered_count: number;
  feedback_count: number;
};
