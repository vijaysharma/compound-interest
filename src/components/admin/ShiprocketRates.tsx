'use client';
import React from 'react';
import { FiTruck } from 'react-icons/fi';
import { useShiprocketRates } from './rates/useShiprocketRates';
import { PincodeInputs } from './rates/PincodeInputs';
import { DimensionsInputs } from './rates/DimensionsInputs';
import { RatesTable } from './rates/RatesTable';
import styles from './ShiprocketRates.module.scss';
interface ShiprocketRatesProps {
  token: string;
}
const ShiprocketRates: React.FC<ShiprocketRatesProps> = ({ token }) => {
  const {
    pickup,
    setPickup,
    delivery,
    setDelivery,
    weight,
    setWeight,
    length,
    setLength,
    breadth,
    setBreadth,
    height,
    setHeight,
    pickupLocation,
    setPickupLocation,
    pickupLoading,
    setPickupLoading,
    deliveryLocation,
    setDeliveryLocation,
    deliveryLoading,
    setDeliveryLoading,
    loading,
    result,
    error,
    fetchRates,
    volumetricWeight,
  } = useShiprocketRates(token);
  return (
    <>
      <h2 className={styles.cardTitle}>
        <FiTruck className={styles.titleIcon} /> Shiprocket Rate Calculator
      </h2>
      {error && <div className={styles.alertError}>{error}</div>}
      <PincodeInputs
        pickup={pickup}
        delivery={delivery}
        pickupLocation={pickupLocation}
        pickupLoading={pickupLoading}
        deliveryLocation={deliveryLocation}
        deliveryLoading={deliveryLoading}
        onPickupChange={setPickup}
        onDeliveryChange={setDelivery}
        onPickupLoadingChange={setPickupLoading}
        onDeliveryLoadingChange={setDeliveryLoading}
        onPickupLocationClear={() => setPickupLocation(null)}
        onDeliveryLocationClear={() => setDeliveryLocation(null)}
      />
      <DimensionsInputs
        length={length}
        breadth={breadth}
        height={height}
        weight={weight}
        volumetricWeight={volumetricWeight}
        loading={loading}
        hasResult={Boolean(result && result.length > 0)}
        onLengthChange={setLength}
        onBreadthChange={setBreadth}
        onHeightChange={setHeight}
        onWeightChange={setWeight}
        onFetchRates={fetchRates}
      />
      {result && <RatesTable result={result} />}
    </>
  );
};
export default ShiprocketRates;
