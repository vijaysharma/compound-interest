export type {
  ShiprocketStatementItem,
  ShiprocketTrackingActivity,
  ShiprocketTrackingData,
  ShiprocketCourierRate,
} from './shiprocketTracking';
export interface ShiprocketUser {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  company_id?: number;
  created_at?: string;
  [key: string]: unknown;
}
export interface ShiprocketPickupLocation {
  id: number;
  pickup_location: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  status?: number;
  [key: string]: unknown;
}
export interface ShiprocketChannel {
  channel_id: number;
  name: string;
  brand_name?: string;
  base_channel_code?: string;
  status?: number;
}
export interface ShiprocketAccountData {
  user: ShiprocketUser | null;
  balance: number | string;
  pickupLocations: ShiprocketPickupLocation[];
  channels?: ShiprocketChannel[];
}
export interface ShiprocketOrderItem {
  name: string;
  sku?: string;
  units: number | string;
  selling_price: number | string;
  discount?: number | string;
  tax?: number | string;
  hsn?: string;
}
export interface ShiprocketShipment {
  id: number;
  courier?: string;
  sr_courier_name?: string;
  courier_id?: number;
  awb?: string;
  weight?: string | number;
  dimensions?: string;
  status?: string | number;
  pickedup_timestamp?: string;
  pickup_scheduled_date?: string;
  shipped_date?: string;
  delivered_date?: string;
  pod?: string;
  cost?: string | number;
}
export interface ShiprocketOrder {
  id: number;
  channel_order_id?: string;
  channel_name?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_address_2?: string;
  customer_city?: string;
  customer_state?: string;
  customer_pincode?: string;
  pickup_location?: string;
  payment_method?: string;
  total?: string | number;
  status: string;
  status_code?: number;
  created_at?: string;
  products?: Array<{
    name: string;
    sku?: string;
    quantity?: number;
    price?: string | number;
  }>;
  shipments?: ShiprocketShipment[];
  others?: {
    weight?: number;
    dimensions?: string;
    order_items?: ShiprocketOrderItem[];
    billing_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_pincode?: string;
  };
  pickup_address_detail?: {
    pickup_code?: string;
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pin_code?: string;
  };
}
