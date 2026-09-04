import React, { useState, useEffect } from 'react';
import { FiTruck, FiMapPin } from 'react-icons/fi';
interface CourierCompany {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  etd: string;
  rating: number | string;
}
const STORAGE_KEY = 'shiprocket_rates_state';
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
      ? `${cleanLocs.slice(0, 2).join(', ')} (+${cleanLocs.length - 2} more)`
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
      if (data.success && data.postcode_details) {
        const { city, state, locality } = data.postcode_details;
        const locList: string[] = Array.isArray(locality)
          ? locality
          : locality
            ? [String(locality)]
            : [];
        const result = formatLocation(locList, city, state);
        if (result.display) {
          pincodeCache.set(trimmed, result);
          return result;
        }
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
  const [cod, setCod] = useState(saved.cod);
  const [pickupLocation, setPickupLocation] = useState<PincodeInfo | null>(null);
  const [pickupLoading, setPickupLoading] = useState(saved.pickup.length === 6);
  const [deliveryLocation, setDeliveryLocation] = useState<PincodeInfo | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(saved.delivery.length === 6);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CourierCompany[] | null>(null);
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
          cod,
        })
      );
    } catch (err) {
      console.warn('Failed to persist shiprocket rates state:', err);
    }
  }, [pickup, delivery, weight, length, breadth, height, cod]);
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
    setResult(null);
    try {
      const res = await fetch('/api/admin/shiprocket-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickup_postcode: pickup,
          delivery_postcode: delivery,
          weight,
          length,
          breadth,
          height,
          cod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch rates');
      }
      setResult(data.data?.data?.available_courier_companies || []);
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
      <h2 className="card-title text-lg flex items-center gap-2">
        <FiTruck className="text-primary" /> Shiprocket Rate Calculator
      </h2>
      {error && <div className="alert alert-error text-sm my-2 py-2">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="min-h-[120px]">
          <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
            Pickup Pincode*
          </label>
          <input
            type="text"
            className="input input-sm input-primary input-bordered w-full"
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
          <div className="min-h-[16px] mt-1 text-[11px]">
            {pickupLoading && (
              <span className="opacity-60 flex items-center gap-1">
                <span className="loading loading-spinner loading-xs text-primary" />
                Looking up location...
              </span>
            )}
            {!pickupLoading && pickupLocation && (
              <span
                className="font-semibold text-primary flex items-center gap-1 truncate"
                title={pickupLocation.tooltip || pickupLocation.display}
              >
                <FiMapPin className="shrink-0 w-3 h-3 text-primary" />
                <span className="text-wrap">{pickupLocation.display}</span>
              </span>
            )}
            {!pickupLoading && !pickupLocation && pickup.length === 6 && (
              <span className="text-error opacity-75">Location not found</span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
            Delivery Pincode*
          </label>
          <input
            type="text"
            className="input input-sm input-primary input-bordered w-full"
            value={delivery}
            maxLength={6}
            placeholder="e.g. 700120"
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
          <div className="min-h-[16px] mt-1 text-[11px]">
            {deliveryLoading && (
              <span className="opacity-60 flex items-center gap-1">
                <span className="loading loading-spinner loading-xs text-primary" />
                Looking up location...
              </span>
            )}
            {!deliveryLoading && deliveryLocation && (
              <span
                className="font-semibold text-primary flex items-center gap-1 truncate"
                title={deliveryLocation.tooltip || deliveryLocation.display}
              >
                <FiMapPin className="shrink-0 w-3 h-3 text-primary" />
                <span className="text-wrap">{deliveryLocation.display}</span>
              </span>
            )}
            {!deliveryLoading && !deliveryLocation && delivery.length === 6 && (
              <span className="text-error opacity-75">Location not found</span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
            Dead Weight (kg)*
          </label>
          <input
            type="number"
            className="input input-sm input-primary input-bordered w-full"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
            COD Required?
          </label>
          <div className="mt-1">
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={cod}
              onChange={(e) => setCod(e.target.checked)}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
            Length (cm)*
          </label>
          <input
            type="number"
            className="input input-sm input-primary input-bordered w-full"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="Required"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
            Breadth (cm)*
          </label>
          <input
            type="number"
            className="input input-sm input-primary input-bordered w-full"
            value={breadth}
            onChange={(e) => setBreadth(e.target.value)}
            placeholder="Required"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
            Height (cm)*
          </label>
          <input
            type="number"
            className="input input-sm input-primary input-bordered w-full"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Required"
          />
        </div>
      </div>
      <div className="mb-4 bg-primary/5 text-primary p-3 rounded-lg flex justify-between items-center text-sm">
        <span>
          Volumetric Weight
          <br /> <span className="text-md">{volumetricWeight} kg</span>
        </span>
        <span className="opacity-80 font-medium">
          Applied Weight
          <br />
          <strong className="text-lg">
            {Math.max(Number(weight || 0), Number(volumetricWeight))} kg
          </strong>
        </span>
      </div>
      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={fetchRates} disabled={loading}>
          {loading ? <span className="loading loading-spinner"></span> : 'Get Rates'}
        </button>
      </div>
      {result && (
        <div className="mt-6">
          <h3 className="font-bold mb-3 border-b pb-2">Available Couriers ({result.length})</h3>
          <div className="overflow-x-auto">
            <table className="table table-sm table-zebra">
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
                    <td className="font-semibold">{c.courier_name}</td>
                    <td>{c.etd}</td>
                    <td className="font-bold text-success">₹{c.rate}</td>
                    <td>{c.rating} ⭐</td>
                  </tr>
                ))}
                {result.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center">
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
