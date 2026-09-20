'use client';
import React from 'react';
import { FiPlus } from 'react-icons/fi';
import type { ShiprocketCreateTabProps } from './createTypes';
import { ShiprocketCreateCustomerSection } from './ShiprocketCreateCustomerSection';
import { ShiprocketCreatePackageSection } from './ShiprocketCreatePackageSection';
import styles from '../ShiprocketDashboard.module.scss';
export type { ShiprocketCreateTabProps };
export const ShiprocketCreateTab: React.FC<ShiprocketCreateTabProps> = React.memo(
  ({
    account,
    orders,
    pickupLoc,
    paymentMode,
    custName,
    custPhone,
    custEmail,
    custAddress,
    custAddress2,
    custPincode,
    custCity,
    custState,
    pincodeLoading,
    weight,
    length,
    breadth,
    height,
    itemName,
    itemSku,
    itemQty,
    itemPrice,
    volumetricWeight,
    appliedWeight,
    creatingOrder,
    createdOrderResult,
    onSubmit,
    onCancel,
    onOpenShipModal,
    onPrintLabel,
    ...handlers
  }) => (
    <form className={styles.formCard} onSubmit={onSubmit}>
      <ShiprocketCreateCustomerSection
        account={account}
        pickupLoc={pickupLoc}
        paymentMode={paymentMode}
        custName={custName}
        custPhone={custPhone}
        custEmail={custEmail}
        custAddress={custAddress}
        custAddress2={custAddress2}
        custPincode={custPincode}
        custCity={custCity}
        custState={custState}
        pincodeLoading={pincodeLoading}
        {...handlers}
      />
      <ShiprocketCreatePackageSection
        weight={weight}
        length={length}
        breadth={breadth}
        height={height}
        itemName={itemName}
        itemSku={itemSku}
        itemQty={itemQty}
        itemPrice={itemPrice}
        volumetricWeight={volumetricWeight}
        appliedWeight={appliedWeight}
        {...handlers}
      />
      {createdOrderResult && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <div>
            <strong>Shipment Created!</strong> Order ID: #{createdOrderResult.orderId}, Shipment ID: #{createdOrderResult.shipmentId}.
            <div className={styles.createdActions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => {
                  const found = orders.find((o) => o.id === createdOrderResult.orderId);
                  if (found) onOpenShipModal(found);
                }}
              >
                Assign Courier & Ship Now
              </button>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => onPrintLabel(createdOrderResult.shipmentId)}
              >
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.formSubmitRow}>
        <button
          type="button"
          className={styles.outlineBtn}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className={styles.primaryBtn} disabled={creatingOrder}>
          {creatingOrder ? (
            <>
              <span className={styles.spinner} /> Creating Order...
            </>
          ) : (
            <>
              <FiPlus /> Create Shipment Order
            </>
          )}
        </button>
      </div>
    </form>
  )
);
ShiprocketCreateTab.displayName = 'ShiprocketCreateTab';
