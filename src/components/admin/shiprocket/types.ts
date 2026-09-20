import type {
  ShiprocketAccountData,
  ShiprocketOrder,
  ShiprocketStatementItem,
  ShiprocketTrackingData,
  ShiprocketCourierRate,
} from '../../../types/shiprocket';
export type TabType = 'shipments' | 'create' | 'history' | 'company';
export type StatusFilter = 'all' | 'new' | 'in_transit' | 'delivered' | 'cancelled';
export interface AlertMessage {
  type: 'success' | 'error';
  text: string;
}
export interface ShiprocketDashboardProps {
  token: string;
}
export interface OrderItemActionHandlers {
  onCopyAwb: (awb: string) => void;
  onOpenTracking: (awb: string) => void;
  onOpenShipModal: (order: ShiprocketOrder) => void;
  onSchedulePickup: (shipmentId: number) => void;
  onPrintLabel: (shipmentId: number) => void;
  onPrintInvoice: (orderId: number) => void;
  onCancelShipment: (order: ShiprocketOrder) => void;
}
export type {
  ShiprocketAccountData,
  ShiprocketOrder,
  ShiprocketStatementItem,
  ShiprocketTrackingData,
  ShiprocketCourierRate,
};
