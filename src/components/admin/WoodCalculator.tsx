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

      <div className="overflow-x-auto w-full mb-4 border border-base-200 rounded-lg">
        <table className="table table-xs w-full">
          <thead className="bg-base-200">
            <tr>
              <th>L ({unit === 'feet' ? 'ft' : 'in'})</th>
              <th>B ({unit === 'feet' ? 'ft' : 'in'})</th>
              <th>T (in)</th>
              <th>Qty</th>
              <th>₹/CFT</th>
              <th>CFT</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {piecesWithCalcs.map((p) => (
              <tr key={p.id}>
                <td className="p-1">
                  <input
                    type="number"
                    className="input input-xs input-bordered w-full max-w-[4rem]"
                    value={p.length}
                    onChange={(e) => updatePiece(p.id, 'length', e.target.value)}
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    className="input input-xs input-bordered w-full max-w-[4rem]"
                    value={p.breadth}
                    onChange={(e) => updatePiece(p.id, 'breadth', e.target.value)}
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    className="input input-xs input-bordered w-full max-w-[4rem]"
                    value={p.thickness}
                    onChange={(e) => updatePiece(p.id, 'thickness', e.target.value)}
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    className="input input-xs input-bordered w-full max-w-[3rem]"
                    value={p.qty}
                    onChange={(e) => updatePiece(p.id, 'qty', e.target.value)}
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    className="input input-xs input-bordered w-full max-w-[5rem]"
                    value={p.pricePerCft}
                    onChange={(e) => updatePiece(p.id, 'pricePerCft', e.target.value)}
                  />
                </td>
                <td className="p-1 text-xs">{p.cft.toFixed(2)}</td>
                <td className="p-1 text-xs font-semibold">₹{p.price.toFixed(0)}</td>
                <td className="p-1">
                  <button
                    className="btn btn-xs btn-ghost text-error"
                    onClick={() => removePiece(p.id)}
                    disabled={pieces.length === 1}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-base-100 p-2 border-t border-base-200">
          <button className="btn btn-xs btn-outline btn-primary w-full" onClick={addPiece}>
            <FiPlus /> Add Piece
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 bg-base-200 p-3 rounded-lg">
        <div>
          <label className="label py-1"><span className="label-text text-xs font-semibold">Cuts Extra (₹)</span></label>
          <input
            type="number"
            className="input input-xs input-bordered w-full"
            value={cutsCharge}
            onChange={(e) => setCutsCharge(e.target.value)}
          />
        </div>
        <div>
          <label className="label py-1"><span className="label-text text-xs font-semibold">Labour (₹)</span></label>
          <input
            type="number"
            className="input input-xs input-bordered w-full"
            value={labourCharge}
            onChange={(e) => setLabourCharge(e.target.value)}
          />
        </div>
        <div>
          <label className="label py-1"><span className="label-text text-xs font-semibold">Shipping (₹)</span></label>
          <input
            type="number"
            className="input input-xs input-bordered w-full"
            value={shippingCharge}
            onChange={(e) => setShippingCharge(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3 bg-base-200 rounded-xl flex justify-between items-center">
          <span className="text-xs font-bold opacity-70 uppercase">Total Volume</span>
          <span className="text-xl font-bold">{totalCft.toFixed(3)} CFT</span>
        </div>
        <div className="p-3 bg-success/10 text-success rounded-xl flex justify-between items-center">
          <span className="text-xs font-bold uppercase">Final Cost</span>
          <span className="text-xl font-bold">₹{totalCost.toFixed(0)}</span>
        </div>
      </div>
    </>
  );
};
export default WoodCalculator;
