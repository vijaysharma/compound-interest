'use client';
import React, { useState, useEffect } from 'react';
import { FiTruck, FiMapPin, FiStar } from 'react-icons/fi';
import { calculateShiprocketRatesAction, getPostcodeDetailsAction } from '../../actions/admin';
import styles from './ShiprocketRates.module.scss';
interface CourierCompany {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  etd: string;
  rating: number | string;
}
const STORAGE_KEY = 'shiprocket_rates_state';
const RATES_STORAGE_KEY = 'shiprocket_rates_result';
interface SavedState {
  pickup: string;
  delivery: string;
  weight: string;
  length: string;
  breadth: string;
  height: string;
  cod: boolean;
}
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
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load shiprocket saved rates:', err);
  }
  return null;
};
interface PincodeInfo {
  display: string;
  tooltip?: string;
}
const pincodeCache = new Map<string, PincodeInfo>();
function formatLocation(localities: string[], city?: string, state?: string): PincodeInfo {
  const cleanLocs = Array.from(
    new Set(localities.map((l) => l?.trim()).filter((l): l is string => Boolean(l && l.length > 0)))
  );
  const cleanCity = city?.trim() || '';
  const cleanState = state?.trim() || '';
  const locSummary =
    cleanLocs.length > 2
      ? `${cleanLocs.slice(0, 4).join(', ')} (+${cleanLocs.length - 4} more)`
      : cleanLocs.join(', ');
  const parts = [locSummary, cleanCity, cleanState].filter(
    (val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx
  );
  const fullParts = [cleanLocs.join(', '), cleanCity, cleanState].filter(
    (val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx
  );
  return {
    display: parts.join(', '),
    tooltip: cleanLocs.length > 2 ? fullParts.join(', ') : undefined,
  };
}
function parseShiprocketData(data: unknown): PincodeInfo | null {
  if (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    (data as { success: boolean }).success &&
    'postcode_details' in data
  ) {
    const details = (
      data as { postcode_details?: { city?: string; state?: string; locality?: unknown } }
    ).postcode_details;
    if (details) {
      const { city, state, locality } = details;
      const locList: string[] = Array.isArray(locality)
        ? locality.map(String)
        : locality
          ? [String(locality)]
          : [];
      const result = formatLocation(locList, city, state);
      if (result.display) {
        return result;
      }
    }
  }
  return null;
}
async function lookupPincode(code: string, signal?: AbortSignal): Promise<PincodeInfo | null> {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) return null;
  if (pincodeCache.has(trimmed)) return pincodeCache.get(trimmed)!;
  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/open/postcode/details?postcode=${encodeURIComponent(trimmed)}`,
      { signal }
    );
    if (res.ok) {
      const data = await res.json();
      const result = parseShiprocketData(data);
      if (result) {
        pincodeCache.set(trimmed, result);
        return result;
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return null;
  }
  try {
    const rawData = await getPostcodeDetailsAction(trimmed);
    if (rawData) {
      const result = parseShiprocketData(rawData);
      if (result) {
        pincodeCache.set(trimmed, result);
        return result;
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return null;
  }
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(trimmed)}`, {
      signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.[0]) {
        const poList = data[0].PostOffice as Array<{
          Name?: string;
          District?: string;
          Block?: string;
          State?: string;
        }>;
        const po = poList[0];
        const locList = poList.map((p) => p.Name).filter((n): n is string => Boolean(n));
        const district = po.District || po.Block;
        const result = formatLocation(locList, district, po.State);
        if (result.display) {
          pincodeCache.set(trimmed, result);
          return result;
        }
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return null;
  }
  return null;
}
const ShiprocketRates: React.FC<{ token: string }> = ({ token }) => {
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
        JSON.stringify({
          pickup,
          delivery,
          weight,
          length,
          breadth,
          height,
        })
      );
    } catch (err) {
      console.warn('Failed to persist shiprocket rates state:', err);
    }
  }, [pickup, delivery, weight, length, breadth, height]);
  useEffect(() => {
    try {
      if (result) {
        localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(result));
      }
    } catch (err) {
      console.warn('Failed to persist shiprocket rates result:', err);
    }
  }, [result]);
  useEffect(() => {
    const trimmed = pickup.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      return;
    }
    let ignore = false;
    const controller = new AbortController();
    lookupPincode(trimmed, controller.signal)
      .then((loc) => {
        if (!ignore) {
          setPickupLocation(loc);
        }
      })
      .finally(() => {
        if (!ignore) {
          setPickupLoading(false);
        }
      });
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [pickup]);
  useEffect(() => {
    const trimmed = delivery.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      return;
    }
    let ignore = false;
    const controller = new AbortController();
    lookupPincode(trimmed, controller.signal)
      .then((loc) => {
        if (!ignore) {
          setDeliveryLocation(loc);
        }
      })
      .finally(() => {
        if (!ignore) {
          setDeliveryLoading(false);
        }
      });
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [delivery]);
  const fetchRates = async () => {
    if (!pickup || !delivery || !weight || !length || !breadth || !height) {
      setError('Pickup, Delivery, Weight, and all dimensions (L x B x H) are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await calculateShiprocketRatesAction(
        {
          pickup_postcode: pickup,
          delivery_postcode: delivery,
          weight,
          length,
          breadth,
          height,
        },
        token || ''
      );
      if (!res.success) {
        throw new Error('Failed to fetch rates');
      }
      const companies = (res.data as { data?: { available_courier_companies?: CourierCompany[] } })?.data?.available_courier_companies || [];
      setResult(companies);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };
  const volumetricWeight =
    length && breadth && height
      ? ((Number(length) * Number(breadth) * Number(height)) / 5000).toFixed(2)
      : '0.00';
  return (
    <>
      <h2 className={styles.cardTitle}>
        <FiTruck className={styles.titleIcon} /> Shiprocket Rate Calculator
      </h2>
      {error && <div className={styles.alertError}>{error}</div>}
      <div className={styles.pincodeGrid}>
        <div className={styles.pincodeCol}>
          <label className={styles.label}>
            Pickup Pincode*
          </label>
          <input
            type="text"
            className={styles.input}
            value={pickup}
            maxLength={6}
            placeholder="e.g. 700157"
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPickup(val);
              if (val.length !== 6) {
                setPickupLocation(null);
                setPickupLoading(false);
              } else {
                setPickupLoading(true);
              }
            }}
          />
          <div className={styles.statusContainer}>
            {pickupLoading && (
              <span className={styles.statusLoading}>
                <span className={styles.spinnerSmall} />
                Looking up location...
              </span>
            )}
            {!pickupLoading && pickupLocation && (
              <span
                className={styles.statusSuccess}
                title={pickupLocation.tooltip || pickupLocation.display}
              >
                <FiMapPin className={styles.locationIcon} />
                <span>{pickupLocation.display}</span>
              </span>
            )}
            {!pickupLoading && !pickupLocation && pickup.length === 6 && (
              <span className={styles.statusError}>Location not found</span>
            )}
          </div>
        </div>
        <div className={styles.pincodeCol}>
          <label className={styles.label}>
            Delivery Pincode*
          </label>
          <input
            type="text"
            className={styles.input}
            value={delivery}
            maxLength={6}
            placeholder="e.g. 560083"
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setDelivery(val);
              if (val.length !== 6) {
                setDeliveryLocation(null);
                setDeliveryLoading(false);
              } else {
                setDeliveryLoading(true);
              }
            }}
          />
          <div className={styles.statusContainer}>
            {deliveryLoading && (
              <span className={styles.statusLoading}>
                <span className={styles.spinnerSmall} />
                Looking up location...
              </span>
            )}
            {!deliveryLoading && deliveryLocation && (
              <span
                className={styles.statusSuccess}
                title={deliveryLocation.tooltip || deliveryLocation.display}
              >
                <FiMapPin className={styles.locationIcon} />
                <span>{deliveryLocation.display}</span>
              </span>
            )}
            {!deliveryLoading && !deliveryLocation && delivery.length === 6 && (
              <span className={styles.statusError}>Location not found</span>
            )}
          </div>
        </div>
      </div>
      <div className={styles.dimensionsGrid}>
        <div>
          <label className={styles.dimLabel}>
            Length (cm)*
          </label>
          <input
            type="number"
            className={styles.input}
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="Required"
          />
        </div>
        <div>
          <label className={styles.dimLabel}>
            Breadth (cm)*
          </label>
          <input
            type="number"
            className={styles.input}
            value={breadth}
            onChange={(e) => setBreadth(e.target.value)}
            placeholder="Required"
          />
        </div>
        <div>
          <label className={styles.dimLabel}>
            Height (cm)*
          </label>
          <input
            type="number"
            className={styles.input}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Required"
          />
        </div>
        <div>
          <label className={styles.dimLabel}>
            D. Weight (kg)*
          </label>
          <input
            type="number"
            className={styles.input}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.summaryBox}>
        <div className={styles.summaryVolumetric}>
          Volumetric Weight
          <span>{volumetricWeight} kg</span>
        </div>
        <div className={styles.summaryApplied}>
          Applied Weight
          <strong>
            {Math.max(Number(weight || 0), Number(volumetricWeight))} kg
          </strong>
        </div>
      </div>
      <div className={styles.actionsRow}>
        <button className={styles.submitBtn} onClick={fetchRates} disabled={loading}>
          {loading ? (
            <span className={styles.btnSpinner} />
          ) : result && result.length > 0 ? (
            'Refresh Rates'
          ) : (
            'Get Rates'
          )}
        </button>
      </div>
      {result && (
        <div className={styles.resultsSection}>
          <h3 className={styles.resultsTitle}>Available Couriers ({result.length})</h3>
          <div className={styles.tableContainer}>
            <table className={styles.ratesTable}>
              <thead>
                <tr>
                  <th>Courier</th>
                  <th>Est. Time</th>
                  <th>Rate</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {result.map((c) => (
                  <tr key={c.courier_company_id}>
                    <td className={styles.courierName}>{c.courier_name}</td>
                    <td>{c.etd}</td>
                    <td className={styles.rateVal}>₹{c.rate}</td>
                    <td className={styles.ratingVal}>
                      {c.rating} <FiStar />
                    </td>
                  </tr>
                ))}
                {result.length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>
                      No couriers available for this route.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};
export default ShiprocketRates;
