'use client';
import { useState, useEffect } from 'react';
import type { WoodPiece, SavedState, WoodPieceWithCalc } from './types';
const STORAGE_KEY = 'wood_calculator_state';
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
export function useWoodCalculator() {
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
  const piecesWithCalcs: WoodPieceWithCalc[] = pieces.map((p) => {
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
  return {
    unit,
    setUnit,
    piecesWithCalcs,
    cutsCharge,
    setCutsCharge,
    labourCharge,
    setLabourCharge,
    shippingCharge,
    setShippingCharge,
    addPiece,
    removePiece,
    updatePiece,
    totalCft,
    totalCost,
  };
}
