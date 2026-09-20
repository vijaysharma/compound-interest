'use client';
import React from 'react';
import { FiPlus } from 'react-icons/fi';
import { useWoodCalculator } from './wood/useWoodCalculator';
import { WoodPieceCard } from './wood/WoodPieceCard';
import { WoodExtraCharges } from './wood/WoodExtraCharges';
import styles from './WoodCalculator.module.scss';
const WoodCalculator: React.FC = () => {
  const {
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
  } = useWoodCalculator();
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
          <WoodPieceCard
            key={p.id}
            piece={p}
            index={index}
            unit={unit}
            isOnlyPiece={piecesWithCalcs.length === 1}
            onRemove={removePiece}
            onUpdate={updatePiece}
          />
        ))}
        <button
          className={styles.addPieceBtn}
          onClick={addPiece}
        >
          <FiPlus /> Add Another Piece
        </button>
      </div>
      <WoodExtraCharges
        cutsCharge={cutsCharge}
        labourCharge={labourCharge}
        shippingCharge={shippingCharge}
        totalCft={totalCft}
        totalCost={totalCost}
        onCutsChange={setCutsCharge}
        onLabourChange={setLabourCharge}
        onShippingChange={setShippingCharge}
      />
    </>
  );
};
export default WoodCalculator;
