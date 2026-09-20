export interface ShiprocketStatementItem {
  transaction_id?: string;
  order_id?: string;
  channel_order_id?: string;
  awb_code?: string;
  applied_weight?: string;
  charged_weight?: string;
  action?: string;
  description?: string;
  debit_amount?: string;
  credit_amount?: string;
  balance_amount?: string;
  created_at?: string;
  date?: string;
}
export interface ShiprocketTrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
  'sr-status'?: string;
  'sr-status-label'?: string;
}
export interface ShiprocketTrackingData {
  track_status: number;
  shipment_status: number;
  shipment_track?: Array<{
    awb_code?: string;
    courier_name?: string;
    current_status?: string;
    pickup_date?: string;
    delivered_date?: string;
    edd?: string;
    origin?: string;
    destination?: string;
    consignee_name?: string;
    pod?: string;
  }>;
  shipment_track_activities?: ShiprocketTrackingActivity[];
}
export interface ShiprocketCourierRate {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  etd: string;
  rating: number | string;
}
