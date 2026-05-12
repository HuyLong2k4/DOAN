import type { TFn, VolunteerDeliveryApiItem, VolunteerDeliveryItem } from './types';

export function mapVolunteerDeliveries(
  data: VolunteerDeliveryApiItem[],
  tFn: TFn,
): VolunteerDeliveryItem[] {
  return data
    .filter((item) => item.delivery_status === 'AGENT_ASSIGNED' || item.delivery_status === 'ON_THE_WAY')
    .map((item) => ({
      id: String(item.id),
      title: item.title,
      quantityLabel: `${tFn('volunteer.foodQtyPrefix')} ${item.quantity || 0} ${item.unit || 'portion'}`,
      receiverName: item.receiver?.full_name || tFn('volunteer.receiverDefault'),
      pickupAddress:
        [item.pickup_address_line, item.pickup_city].filter(Boolean).join(', ') ||
        tFn('volunteer.pickupAddrUnavailable'),
      pickupLatitude: item.pickup_latitude,
      pickupLongitude: item.pickup_longitude,
      deliveryStatus: item.delivery_status as 'AGENT_ASSIGNED' | 'ON_THE_WAY',
    }));
}
