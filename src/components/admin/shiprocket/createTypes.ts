import type { ShiprocketAccountData, ShiprocketOrder } from './types';
export interface ShiprocketCreateTabProps {
  account: ShiprocketAccountData | null;
  orders: ShiprocketOrder[];
  pickupLoc: string;
  paymentMode: 'Prepaid' | 'COD';
  custName: string;
  custPhone: string;
  custEmail: string;
  custAddress: string;
  custAddress2: string;
  custPincode: string;
  custCity: string;
  custState: string;
  pincodeLoading: boolean;
  weight: string;
  length: string;
  breadth: string;
  height: string;
  items: Array<{ name: string; sku: string; units: string; selling_price: string }>;
  shippingCharges: string;
  discount: string;
  volumetricWeight: string;
  appliedWeight: string;
  creatingOrder: boolean;
  createdOrderResult: CreatedOrderResult | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onOpenShipModal: (order: ShiprocketOrder) => void;
  onPickupLocChange: (val: string) => void;
  onPaymentModeChange: (val: 'Prepaid' | 'COD') => void;
  onCustNameChange: (val: string) => void;
  onCustPhoneChange: (val: string) => void;
  onCustEmailChange: (val: string) => void;
  onCustAddressChange: (val: string) => void;
  onCustAddress2Change: (val: string) => void;
  onCustPincodeChange: (val: string) => void;
  onCustCityChange: (val: string) => void;
  onCustStateChange: (val: string) => void;
  onWeightChange: (val: string) => void;
  onLengthChange: (val: string) => void;
  onBreadthChange: (val: string) => void;
  onHeightChange: (val: string) => void;
  onShippingChargesChange: (val: string) => void;
  onDiscountChange: (val: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, field: 'name' | 'sku' | 'units' | 'selling_price', val: string) => void;
}

/** The order just created, with a snapshot good enough to open the ship dialog right away. */
export interface CreatedOrderResult {
  orderId: number;
  shipmentId: number;
  order: ShiprocketOrder;
}
