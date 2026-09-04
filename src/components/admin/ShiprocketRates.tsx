import React, { useState, useEffect } from 'react';
import { FiTruck } from 'react-icons/fi';
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
const ShiprocketRates: React.FC<{ token: string }> = ({ token }) => {
  const [saved] = useState<SavedState>(getSavedState);
  const [pickup, setPickup] = useState(saved.pickup);
  const [delivery, setDelivery] = useState(saved.delivery);
  const [weight, setWeight] = useState(saved.weight);
  const [length, setLength] = useState(saved.length);
  const [breadth, setBreadth] = useState(saved.breadth);
  const [height, setHeight] = useState(saved.height);
  const [cod, setCod] = useState(saved.cod);
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
      <div className="bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm mb-6 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
              Pickup Pincode*
            </label>
            <input
              type="text"
              className="input input-sm input-primary input-bordered w-full"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
              Delivery Pincode*
            </label>
            <input
              type="text"
              className="input input-sm input-primary input-bordered w-full"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
            />
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
        <div className="mt-2 bg-success/10 text-success p-3 rounded-lg flex justify-between items-center text-sm shadow-inner">
          <span>
            Volumetric Weight: <strong className="text-lg">{volumetricWeight} kg</strong>
          </span>
          <span className="opacity-80 font-medium">
            Applied Weight:{' '}
            <strong className="text-lg">
              {Math.max(Number(weight || 0), Number(volumetricWeight))} kg
            </strong>
          </span>
        </div>
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
