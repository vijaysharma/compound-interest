'use client';
import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import styles from './WoodCalculator.module.scss';
interface WoodPiece {
  id: string;
  length: string;
  breadth: string;
  thickness: string;
  qty: string;
  pricePerCft: string;
}
const STORAGE_KEY = 'wood_calculator_state';
interface SavedState {
  unit: 'inches' | 'feet';
  pieces: WoodPiece[];
  cutsCharge: string;
  labourCharge: string;
  shippingCharge: string;
}
const getSavedState = (): SavedState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          unit: parsed.unit === 'inches' ? 'inches' : 'feet',
          pieces:
            Array.isArray(parsed.pieces) && parsed.pieces.length > 0
              ? parsed.pieces
              : [{ id: '1', length: '', breadth: '', thickness: '', qty: '1', pricePerCft: '' }],
          cutsCharge: parsed.cutsCharge ?? '',
          labourCharge: parsed.labourCharge ?? '',
          shippingCharge: parsed.shippingCharge ?? '',
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load wood calculator state:', err);
  }
  return {
    unit: 'feet',
    pieces: [{ id: '1', length: '', breadth: '', thickness: '', qty: '1', pricePerCft: '' }],
    cutsCharge: '',
    labourCharge: '',
    shippingCharge: '',
  };
};
const WoodCalculator: React.FC = () => {
  const [saved] = useState<SavedState>(getSavedState);
  const [unit, setUnit] = useState<'inches' | 'feet'>(saved.unit);
  const [pieces, setPieces] = useState<WoodPiece[]>(saved.pieces);
  const [cutsCharge, setCutsCharge] = useState(saved.cutsCharge);
  const [labourCharge, setLabourCharge] = useState(saved.labourCharge);
  const [shippingCharge, setShippingCharge] = useState(saved.shippingCharge);
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ unit, pieces, cutsCharge, labourCharge, shippingCharge })
      );
    } catch (err) {
      console.warn('Failed to persist wood calculator state:', err);
    }
  }, [unit, pieces, cutsCharge, labourCharge, shippingCharge]);
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
    return { ...p, cft, price };
  });
  const totalCft = piecesWithCalcs.reduce((sum, p) => sum + p.cft, 0);
  const totalBasePrice = piecesWithCalcs.reduce((sum, p) => sum + p.price, 0);
  const totalExtra =
    (parseFloat(cutsCharge) || 0) +
    (parseFloat(labourCharge) || 0) +
    (parseFloat(shippingCharge) || 0);
  const totalCost = totalBasePrice + totalExtra;
  return (
    <>
      <div className={styles.headerRow}>
        <div className={styles.switchGroup}>
          <button
            className={`${styles.switchBtn} ${unit === 'feet' ? styles.active : ''}`}
            onClick={() => setUnit('feet')}
          >
            L/B in ft
          </button>
          <button
            className={`${styles.switchBtn} ${unit === 'inches' ? styles.active : ''}`}
            onClick={() => setUnit('inches')}
          >
            All inches
          </button>
        </div>
      </div>
      <div className={styles.piecesList}>
        {piecesWithCalcs.map((p, index) => (
          <div
            key={p.id}
            className={styles.pieceCard}
          >
            <div className={styles.pieceHeader}>
              <span className={styles.pieceBadge}>
                Piece {index + 1}
              </span>
              <button
                className={styles.removeBtn}
                onClick={() => removePiece(p.id)}
                disabled={pieces.length === 1}
              >
                <FiTrash2 />
              </button>
            </div>
            <div className={styles.pieceGrid}>
              <div>
                <label className={styles.label}>
                  Length ({unit === 'feet' ? 'ft' : 'in'})
                </label>
                <input
                  type="number"
                  className={styles.input}
                  value={p.length}
                  onChange={(e) => updatePiece(p.id, 'length', e.target.value)}
                />
              </div>
              <div>
                <label className={styles.label}>
                  Breadth ({unit === 'feet' ? 'ft' : 'in'})
                </label>
                <input
                  type="number"
                  className={styles.input}
                  value={p.breadth}
                  onChange={(e) => updatePiece(p.id, 'breadth', e.target.value)}
                />
              </div>
              <div>
                <label className={styles.label}>
                  Thickness (in)
                </label>
                <input
                  type="number"
                  className={styles.input}
                  value={p.thickness}
                  onChange={(e) => updatePiece(p.id, 'thickness', e.target.value)}
                />
              </div>
              <div>
                <label className={styles.label}>Quantity</label>
                <input
                  type="number"
                  className={styles.input}
                  value={p.qty}
                  onChange={(e) => updatePiece(p.id, 'qty', e.target.value)}
                />
              </div>
              <div>
                <label className={styles.label}>
                  Price / CFT (₹)
                </label>
                <input
                  type="number"
                  className={`${styles.input} ${styles.priceInput}`}
                  value={p.pricePerCft}
                  onChange={(e) => updatePiece(p.id, 'pricePerCft', e.target.value)}
                />
              </div>
              <div className={styles.cftBox}>
                <span className={styles.cftText}>{p.cft.toFixed(2)} CFT</span>
                <span className={styles.priceText}>₹{p.price.toFixed(0)}</span>
              </div>
            </div>
          </div>
        ))}
        <button
          className={styles.addPieceBtn}
          onClick={addPiece}
        >
          <FiPlus /> Add Another Piece
        </button>
      </div>
      <h3 className={styles.sectionHeader}>Extra Charges</h3>
      <div className={styles.extraChargesBox}>
        <div>
          <label className={styles.label}>Cuts (₹)</label>
          <input
            type="number"
            className={styles.input}
            value={cutsCharge}
            onChange={(e) => setCutsCharge(e.target.value)}
          />
        </div>
        <div>
          <label className={styles.label}>Labour (₹)</label>
          <input
            type="number"
            className={styles.input}
            value={labourCharge}
            onChange={(e) => setLabourCharge(e.target.value)}
          />
        </div>
        <div>
          <label className={styles.label}>Shipping (₹)</label>
          <input
            type="number"
            className={styles.input}
            value={shippingCharge}
            onChange={(e) => setShippingCharge(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.totalsGrid}>
        <div className={styles.totalCard}>
          <span className={styles.totalLabel}>Total Volume</span>
          <span className={styles.totalVal}>{totalCft.toFixed(3)} CFT</span>
        </div>
        <div className={styles.finalCostCard}>
          <span className={styles.totalLabel}>Final Cost</span>
          <span className={styles.finalCostVal}>₹{totalCost.toFixed(0)}</span>
        </div>
      </div>
    </>
  );
};
export default WoodCalculator;
