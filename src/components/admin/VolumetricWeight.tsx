import React, { useState } from 'react';
const VolumetricWeight: React.FC = () => {
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [height, setHeight] = useState('');
  const l = parseFloat(length) || 0;
  const b = parseFloat(breadth) || 0;
  const h = parseFloat(height) || 0;
  // Shiprocket divisor is typically 5000 for domestic
  const volumetricWeight = (l * b * h) / 5000;
  return (
    <div className="card bg-base-100 shadow-md border border-base-300">
      <div className="card-body">
        <h2 className="card-title text-lg">Volumetric Weight Calculator</h2>
        <p className="text-sm opacity-70 mb-4">Calculate volumetric weight (L x B x H / 5000) for standard shipping.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Length (cm)</span></label>
            <input type="number" className="input input-bordered" value={length} onChange={e => setLength(e.target.value)} placeholder="0" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Breadth (cm)</span></label>
            <input type="number" className="input input-bordered" value={breadth} onChange={e => setBreadth(e.target.value)} placeholder="0" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Height (cm)</span></label>
            <input type="number" className="input input-bordered" value={height} onChange={e => setHeight(e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="mt-6 p-4 bg-primary/10 rounded-xl text-center">
          <p className="text-sm font-semibold opacity-70 uppercase tracking-wider mb-1">Volumetric Weight</p>
          <p className="text-3xl font-bold text-primary">{volumetricWeight > 0 ? volumetricWeight.toFixed(3) : '0.000'} kg</p>
        </div>
      </div>
    </div>
  );
};
export default VolumetricWeight;
