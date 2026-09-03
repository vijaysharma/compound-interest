import React, { useState } from 'react';
import { FiTruck } from 'react-icons/fi';
interface CourierCompany {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  etd: string;
  rating: number | string;
}
const ShiprocketRates: React.FC<{ token: string }> = ({ token }) => {
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [height, setHeight] = useState('');
  const [cod, setCod] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CourierCompany[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchRates = async () => {
    if (!pickup || !delivery || !weight) {
      setError('Pickup, Delivery, and Weight are required.');
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
  return (
    <div className="card bg-base-100 shadow-md border border-base-300">
      <div className="card-body">
        <h2 className="card-title text-lg flex items-center gap-2">
          <FiTruck className="text-primary" /> Shiprocket Rate Calculator
        </h2>
        {error && <div className="alert alert-error text-sm my-2 py-2">{error}</div>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Pickup Pincode*</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Delivery Pincode*</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Weight (kg)*</span>
            </label>
            <input
              type="number"
              className="input input-bordered input-sm"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label cursor-pointer flex flex-col items-start gap-1">
              <span className="label-text font-bold">COD Required?</span>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm mt-1"
                checked={cod}
                onChange={(e) => setCod(e.target.checked)}
              />
            </label>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs">Length (cm)</span>
            </label>
            <input
              type="number"
              className="input input-bordered input-sm"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs">Breadth (cm)</span>
            </label>
            <input
              type="number"
              className="input input-bordered input-sm"
              value={breadth}
              onChange={(e) => setBreadth(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs">Height (cm)</span>
            </label>
            <input
              type="number"
              className="input input-bordered input-sm"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
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
      </div>
    </div>
  );
};
export default ShiprocketRates;
