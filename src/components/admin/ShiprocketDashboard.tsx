'use client';
import React, { useState, useMemo } from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import type { TabType, OrderItemActionHandlers } from './shiprocket/types';
import { useShiprocketData } from './shiprocket/useShiprocketData';
import { useShiprocketModals } from './shiprocket/useShiprocketModals';
import { useShiprocketCreateOrder } from './shiprocket/useShiprocketCreateOrder';
import { useShiprocketFilter } from './shiprocket/useShiprocketFilter';
import { ShiprocketHeader } from './shiprocket/ShiprocketHeader';
import { ShiprocketStats } from './shiprocket/ShiprocketStats';
import { ShiprocketTabsNav } from './shiprocket/ShiprocketTabsNav';
import { ShiprocketShipmentsTab } from './shiprocket/ShiprocketShipmentsTab';
import { ShiprocketCreateTab } from './shiprocket/ShiprocketCreateTab';
import { ShiprocketHistoryTab } from './shiprocket/ShiprocketHistoryTab';
import { ShiprocketCompanyTab } from './shiprocket/ShiprocketCompanyTab';
import { ShiprocketTrackingModal } from './shiprocket/ShiprocketTrackingModal';
import { ShiprocketCourierModal } from './shiprocket/ShiprocketCourierModal';
import styles from './ShiprocketDashboard.module.scss';
interface Props {
  token: string;
}
const ShiprocketDashboard: React.FC<Props> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<TabType>('shipments');
  const data = useShiprocketData(token);
  const modals = useShiprocketModals(token, data.account, data.fetchOrders, data.setAlertMsg);
  const createForm = useShiprocketCreateOrder(token, data.account, data.fetchOrders, data.setAlertMsg);
  const filter = useShiprocketFilter(data.orders);
  const itemActions: OrderItemActionHandlers = useMemo(
    () => ({
      onCopyAwb: data.handleCopyAwb,
      onOpenTracking: modals.handleOpenTracking,
      onOpenShipModal: modals.handleOpenShipModal,
      onSchedulePickup: data.handleSchedulePickup,
      onPrintLabel: data.handlePrintLabel,
      onPrintInvoice: data.handlePrintInvoice,
      onCancelShipment: data.handleCancelShipment,
    }),
    [data, modals]
  );
  return (
    <div className={styles.dashboard}>
      <ShiprocketHeader
        account={data.account}
        loading={data.loadingAccount || data.loadingOrders || data.loadingStatement}
        onRefreshAll={data.fetchAll}
        onNewShipment={() => {
          setActiveTab('create');
          createForm.setCreatedOrderResult(null);
        }}
      />
      <ShiprocketStats balance={data.account?.balance} stats={filter.stats} />
      <ShiprocketTabsNav
        activeTab={activeTab}
        ordersCount={data.orders.length}
        historyCount={data.statement.length}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'create') createForm.setCreatedOrderResult(null);
        }}
      />
      {data.alertMsg && (
        <div
          className={`${styles.alert} ${
            data.alertMsg.type === 'success' ? styles.alertSuccess : styles.alertError
          }`}
        >
          {data.alertMsg.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{data.alertMsg.text}</span>
        </div>
      )}
      {activeTab === 'shipments' && (
        <ShiprocketShipmentsTab
          orders={data.orders}
          filteredOrders={filter.filteredOrders}
          statusFilter={filter.statusFilter}
          searchQuery={filter.searchQuery}
          loadingOrders={data.loadingOrders}
          actionBusy={data.actionBusy}
          stats={filter.stats}
          actions={itemActions}
          onSetStatusFilter={filter.setStatusFilter}
          onSetSearchQuery={filter.setSearchQuery}
          onCreateShipmentTab={() => setActiveTab('create')}
        />
      )}
      {activeTab === 'create' && (
        <ShiprocketCreateTab
          account={data.account}
          orders={data.orders}
          onSubmit={createForm.handleCreateOrder}
          onCancel={() => setActiveTab('shipments')}
          onOpenShipModal={modals.handleOpenShipModal}
          onPrintLabel={data.handlePrintLabel}
          onPickupLocChange={createForm.setPickupLoc}
          onPaymentModeChange={createForm.setPaymentMode}
          onCustNameChange={createForm.setCustName}
          onCustPhoneChange={createForm.setCustPhone}
          onCustEmailChange={createForm.setCustEmail}
          onCustAddressChange={createForm.setCustAddress}
          onCustAddress2Change={createForm.setCustAddress2}
          onCustPincodeChange={createForm.setCustPincode}
          onCustCityChange={createForm.setCustCity}
          onCustStateChange={createForm.setCustState}
          onWeightChange={createForm.setWeight}
          onLengthChange={createForm.setLength}
          onBreadthChange={createForm.setBreadth}
          onHeightChange={createForm.setHeight}
          onItemNameChange={createForm.setItemName}
          onItemSkuChange={createForm.setItemSku}
          onItemQtyChange={createForm.setItemQty}
          onItemPriceChange={createForm.setItemPrice}
          {...createForm}
        />
      )}
      {activeTab === 'history' && (
        <ShiprocketHistoryTab
          statement={data.statement}
          loadingStatement={data.loadingStatement}
          onRefreshStatement={data.fetchStatement}
        />
      )}
      {activeTab === 'company' && <ShiprocketCompanyTab account={data.account} />}
      {modals.trackingModalAwb && (
        <ShiprocketTrackingModal
          awb={modals.trackingModalAwb}
          trackingData={modals.trackingData}
          loadingTracking={modals.loadingTracking}
          onClose={() => modals.setTrackingModalAwb(null)}
        />
      )}
      {modals.shipModalOrder && (
        <ShiprocketCourierModal
          order={modals.shipModalOrder}
          couriersList={modals.couriersList}
          loadingCouriers={modals.loadingCouriers}
          assigningCourier={modals.assigningCourier}
          onAssignCourier={modals.handleAssignCourier}
          onClose={() => modals.setShipModalOrder(null)}
        />
      )}
    </div>
  );
};
export default ShiprocketDashboard;
