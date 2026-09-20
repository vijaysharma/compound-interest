'use client';
import { useState, useEffect, useCallback } from 'react';
import { calculateShiprocketRatesAction } from '../../../actions/admin';
import type { CourierCompany, SavedState, PincodeInfo } from './types';
import { lookupPincode } from './pincodeLookup';
const STORAGE_KEY = 'shiprocket_rates_state';
const RATES_STORAGE_KEY = 'shiprocket_rates_result';
const getSavedState = (): SavedState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          pickup: parsed.pickup ?? '',
          delivery: parsed.delivery ?? '',
          weight: parsed.weight ?? '',
          length: parsed.length ?? '',
          breadth: parsed.breadth ?? '',
          height: parsed.height ?? '',
          cod: Boolean(parsed.cod),
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load shiprocket rates state:', err);
  }
  return {
    pickup: '',
    delivery: '',
    weight: '',
    length: '',
    breadth: '',
    height: '',
    cod: false,
  };
};
const getSavedRates = (): CourierCompany[] | null => {
  try {
    const saved = localStorage.getItem(RATES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load shiprocket saved rates:', err);
  }
  return null;
};
export function useShiprocketRates(token: string) {
  const [saved] = useState<SavedState>(getSavedState);
  const [pickup, setPickup] = useState(saved.pickup);
  const [delivery, setDelivery] = useState(saved.delivery);
  const [weight, setWeight] = useState(saved.weight);
  const [length, setLength] = useState(saved.length);
  const [breadth, setBreadth] = useState(saved.breadth);
  const [height, setHeight] = useState(saved.height);
  const [pickupLocation, setPickupLocation] = useState<PincodeInfo | null>(null);
  const [pickupLoading, setPickupLoading] = useState(saved.pickup.length === 6);
  const [deliveryLocation, setDeliveryLocation] = useState<PincodeInfo | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(saved.delivery.length === 6);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CourierCompany[] | null>(getSavedRates);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ pickup, delivery, weight, length, breadth, height })
      );
    } catch (err) {
      console.warn('Failed to persist shiprocket rates state:', err);
    }
  }, [pickup, delivery, weight, length, breadth, height]);
  useEffect(() => {
    try {
      if (result) localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(result));
    } catch (err) {
      console.warn('Failed to persist shiprocket rates result:', err);
    }
  }, [result]);
  useEffect(() => {
    const trimmed = pickup.trim();
    if (!/^\d{6}$/.test(trimmed)) return;
    let ignore = false;
    const controller = new AbortController();
    lookupPincode(trimmed, controller.signal)
      .then((loc) => {
        if (!ignore) setPickupLocation(loc);
      })
      .finally(() => {
        if (!ignore) setPickupLoading(false);
      });
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [pickup]);
  useEffect(() => {
    const trimmed = delivery.trim();
    if (!/^\d{6}$/.test(trimmed)) return;
    let ignore = false;
    const controller = new AbortController();
    lookupPincode(trimmed, controller.signal)
      .then((loc) => {
        if (!ignore) setDeliveryLocation(loc);
      })
      .finally(() => {
        if (!ignore) setDeliveryLoading(false);
      });
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [delivery]);
  const fetchRates = useCallback(async () => {
    if (!pickup || !delivery || !weight || !length || !breadth || !height) {
      setError('Pickup, Delivery, Weight, and all dimensions (L x B x H) are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await calculateShiprocketRatesAction(
        { pickup_postcode: pickup, delivery_postcode: delivery, weight, length, breadth, height },
        token || ''
      );
      if (!res.success) throw new Error('Failed to fetch rates');
      const companies = (res.data as { data?: { available_courier_companies?: CourierCompany[] } })?.data?.available_courier_companies || [];
      setResult(companies);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [pickup, delivery, weight, length, breadth, height, token]);
  const volumetricWeight =
    length && breadth && height
      ? ((Number(length) * Number(breadth) * Number(height)) / 5000).toFixed(2)
      : '0.00';
  return {
    pickup, setPickup, delivery, setDelivery, weight, setWeight, length, setLength,
    breadth, setBreadth, height, setHeight, pickupLocation, setPickupLocation,
    pickupLoading, setPickupLoading, deliveryLocation, setDeliveryLocation,
    deliveryLoading, setDeliveryLoading, loading, result, error, fetchRates, volumetricWeight,
  };
}
