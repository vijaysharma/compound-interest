import React, { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface WoodPiece {
  id: string;
  length: string;
  breadth: string;
  thickness: string;
  qty: string;
  pricePerCft: string;
}

const WoodCalculator: React.FC = () => {
  const [unit, setUnit] = useState<'inches' | 'feet'>('feet');
  const [pieces, setPieces] = useState<WoodPiece[]>([
    { id: '1', length: '', breadth: '', thickness: '', qty: '1', pricePerCft: '' },
  ]);
  const [cutsCharge, setCutsCharge] = useState('');
  const [labourCharge, setLabourCharge] = useState('');
  const [shippingCharge, setShippingCharge] = useState('');

  const addPiece = () => {
    setPieces([
      ...pieces,
      {
        id: Date.now().toString(),
        length: '',
        breadth: '',
        thickness: '',
        qty: '1',
        pricePerCft: pieces.length > 0 ? pieces[pieces.length - 1].pricePerCft : '',
      },
    ]);
  };

  const removePiece = (id: string) => {
    if (pieces.length > 1) {
      setPieces(pieces.filter((p) => p.id !== id));
    }
  };

  const updatePiece = (id: string, field: keyof WoodPiece, value: string) => {
    setPieces(pieces.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  let totalCft = 0;
  let totalBasePrice = 0;

  const piecesWithCalcs = pieces.map((p) => {
    const l = parseFloat(p.length) || 0;
    const b = parseFloat(p.breadth) || 0;
    const t = parseFloat(p.thickness) || 0;
    const q = parseFloat(p.qty) || 1;
    let cft = 0;
    if (unit === 'feet') {
      cft = l * b * (t / 12) * q;
    } else {
      cft = ((l * b * t) / 1728) * q;
    }
    const price = cft * (parseFloat(p.pricePerCft) || 0);
    totalCft += cft;
    totalBasePrice += price;
    return { ...p, cft, price };
  });

  const totalExtra =
    (parseFloat(cutsCharge) || 0) +
    (parseFloat(labourCharge) || 0) +
    (parseFloat(shippingCharge) || 0);
  const totalCost = totalBasePrice + totalExtra;

  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="card-title text-lg">Wood Cubic Calculator</h2>
          <p className="text-sm opacity-70">
            Calculate volume (CFT) and pricing for multiple pieces.
          </p>
        </div>
        <div className="flex gap-2 bg-base-200 p-1 rounded-lg">
          <button
            className={`btn btn-xs ${unit === 'feet' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setUnit('feet')}
          >
            L/B in ft
          </button>
          <button
            className={`btn btn-xs ${unit === 'inches' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setUnit('inches')}
          >
            All inches
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {piecesWithCalcs.map((p, index) => (
          <div key={p.id} className="bg-base-100 border border-base-300 rounded-xl p-4 relative shadow-sm">
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Piece {index + 1}</span>
              <button
                className="btn btn-xs btn-circle btn-ghost text-error"
                onClick={() => removePiece(p.id)}
                disabled={pieces.length === 1}
              >
                <FiTrash2 />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-[11px] font-bold opacity-70 mb-1">
                  Length ({unit === 'feet' ? 'ft' : 'in'})
                </label>
                <input
                  type="number"
                  className="input input-sm input-bordered w-full"
                  value={p.length}
                  onChange={(e) => updatePiece(p.id, 'length', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold opacity-70 mb-1">
                  Breadth ({unit === 'feet' ? 'ft' : 'in'})
                </label>
                <input
                  type="number"
                  className="input input-sm input-bordered w-full"
                  value={p.breadth}
                  onChange={(e) => updatePiece(p.id, 'breadth', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold opacity-70 mb-1">
                  Thickness (in)
                </label>
                <input
                  type="number"
                  className="input input-sm input-bordered w-full"
                  value={p.thickness}
                  onChange={(e) => updatePiece(p.id, 'thickness', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold opacity-70 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  className="input input-sm input-bordered w-full"
                  value={p.qty}
                  onChange={(e) => updatePiece(p.id, 'qty', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold opacity-70 mb-1">
                  Price / CFT (₹)
                </label>
                <input
                  type="number"
                  className="input input-sm input-bordered w-full text-success font-semibold"
                  value={p.pricePerCft}
                  onChange={(e) => updatePiece(p.id, 'pricePerCft', e.target.value)}
                />
              </div>
              <div className="flex flex-col justify-end items-end pb-1 bg-base-200 rounded px-2">
                <span className="text-[11px] opacity-70 font-semibold">{p.cft.toFixed(2)} CFT</span>
                <span className="font-bold text-sm text-primary">₹{p.price.toFixed(0)}</span>
              </div>
            </div>
          </div>
        ))}
        <button className="btn btn-sm btn-outline btn-primary w-full border-dashed" onClick={addPiece}>
          <FiPlus /> Add Another Piece
        </button>
      </div>

      <h3 className="font-bold text-sm opacity-70 uppercase tracking-wider mb-2">Extra Charges</h3>
      <div className="grid grid-cols-3 gap-3 mb-6 bg-base-200 p-4 rounded-xl">
        <div>
          <label className="block text-[11px] font-bold opacity-70 mb-1">Cuts (₹)</label>
          <input
            type="number"
            className="input input-sm input-bordered w-full"
            value={cutsCharge}
            onChange={(e) => setCutsCharge(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold opacity-70 mb-1">Labour (₹)</label>
          <input
            type="number"
            className="input input-sm input-bordered w-full"
            value={labourCharge}
            onChange={(e) => setLabourCharge(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold opacity-70 mb-1">Shipping (₹)</label>
          <input
            type="number"
            className="input input-sm input-bordered w-full"
            value={shippingCharge}
            onChange={(e) => setShippingCharge(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-base-200 rounded-xl flex justify-between items-center">
          <span className="text-xs font-bold opacity-70 uppercase">Total Volume</span>
          <span className="text-xl font-bold">{totalCft.toFixed(3)} CFT</span>
        </div>
        <div className="p-4 bg-success/10 text-success rounded-xl flex justify-between items-center shadow-inner">
          <span className="text-xs font-bold uppercase">Final Cost</span>
          <span className="text-2xl font-bold">₹{totalCost.toFixed(0)}</span>
        </div>
      </div>
    </>
  );
};
export default WoodCalculator;
