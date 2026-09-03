import React, { useState } from 'react';
const WoodCalculator: React.FC = () => {
  const [unit, setUnit] = useState<'inches' | 'feet'>('feet');
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [thickness, setThickness] = useState(''); // Usually measured in inches even if L/B are feet
  const [qty, setQty] = useState('1');
  const [pricePerCft, setPricePerCft] = useState('');
  const [cutsCharge, setCutsCharge] = useState('');
  const [labourCharge, setLabourCharge] = useState('');
  const [shippingCharge, setShippingCharge] = useState('');
  const l = parseFloat(length) || 0;
  const b = parseFloat(breadth) || 0;
  const t = parseFloat(thickness) || 0;
  const q = parseFloat(qty) || 1;
  let cft = 0;
  if (unit === 'feet') {
    // Length (ft) * Breadth (ft) * Thickness (inches) / 12
    cft = (l * b * (t / 12)) * q;
  } else {
    // Length (in) * Breadth (in) * Thickness (in) / 1728
    cft = (l * b * t) / 1728 * q;
  }
  const basePrice = cft * (parseFloat(pricePerCft) || 0);
  const totalExtra = (parseFloat(cutsCharge) || 0) + (parseFloat(labourCharge) || 0) + (parseFloat(shippingCharge) || 0);
  const totalCost = basePrice + totalExtra;
  return (
    <div className="card bg-base-100 shadow-md border border-base-300">
      <div className="card-body">
        <h2 className="card-title text-lg">Wood Cubic Calculator</h2>
        <p className="text-sm opacity-70 mb-4">Calculate wood volume (CFT) and total pricing with extra charges.</p>
        
        <div className="flex gap-4 mb-4">
          <label className="cursor-pointer flex items-center gap-2">
            <input type="radio" name="woodUnit" className="radio radio-primary radio-sm" checked={unit === 'feet'} onChange={() => setUnit('feet')} />
            <span className="text-sm">L & B in Feet, T in Inches</span>
          </label>
          <label className="cursor-pointer flex items-center gap-2">
            <input type="radio" name="woodUnit" className="radio radio-primary radio-sm" checked={unit === 'inches'} onChange={() => setUnit('inches')} />
            <span className="text-sm">All in Inches</span>
          </label>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="form-control">
            <label className="label"><span className="label-text">Length ({unit === 'feet' ? 'ft' : 'in'})</span></label>
            <input type="number" className="input input-bordered input-sm" value={length} onChange={e => setLength(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Breadth ({unit === 'feet' ? 'ft' : 'in'})</span></label>
            <input type="number" className="input input-bordered input-sm" value={breadth} onChange={e => setBreadth(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Thickness (in)</span></label>
            <input type="number" className="input input-bordered input-sm" value={thickness} onChange={e => setThickness(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Quantity</span></label>
            <input type="number" className="input input-bordered input-sm" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-4 border-t border-base-200">
          <div className="form-control">
            <label className="label"><span className="label-text">Price per CFT (₹)</span></label>
            <input type="number" className="input input-bordered input-sm" value={pricePerCft} onChange={e => setPricePerCft(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Cuts Extra (₹)</span></label>
            <input type="number" className="input input-bordered input-sm" value={cutsCharge} onChange={e => setCutsCharge(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Labour (₹)</span></label>
            <input type="number" className="input input-bordered input-sm" value={labourCharge} onChange={e => setLabourCharge(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Shipping (₹)</span></label>
            <input type="number" className="input input-bordered input-sm" value={shippingCharge} onChange={e => setShippingCharge(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="p-4 bg-base-200 rounded-xl text-center">
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-1">Total Volume</p>
            <p className="text-2xl font-bold">{cft.toFixed(4)} CFT</p>
          </div>
          <div className="p-4 bg-success/10 rounded-xl text-center">
            <p className="text-xs font-semibold text-success uppercase tracking-wider mb-1">Total Final Cost</p>
            <p className="text-2xl font-bold text-success">₹{totalCost.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WoodCalculator;
