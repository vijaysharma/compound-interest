export interface CourierCompany {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  etd: string;
  rating: number | string;
}
export interface SavedState {
  pickup: string;
  delivery: string;
  weight: string;
  length: string;
  breadth: string;
  height: string;
  cod: boolean;
}
export interface PincodeInfo {
  display: string;
  tooltip?: string;
}
