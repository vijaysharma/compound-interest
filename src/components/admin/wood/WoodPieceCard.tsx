'use client';
import React from 'react';
import { FiTrash2 } from 'react-icons/fi';
import type { WoodPiece, WoodPieceWithCalc } from './types';
import styles from '../WoodCalculator.module.scss';
export interface WoodPieceCardProps {
  piece: WoodPieceWithCalc;
  index: number;
  unit: 'inches' | 'feet';
  isOnlyPiece: boolean;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof WoodPiece, value: string) => void;
}
export const WoodPieceCard: React.FC<WoodPieceCardProps> = React.memo(
  ({ piece, index, unit, isOnlyPiece, onRemove, onUpdate }) => (
    <div className={styles.pieceCard}>
      <div className={styles.pieceHeader}>
        <span className={styles.pieceBadge}>
          Piece {index + 1}
        </span>
        <button
          className={styles.removeBtn}
          onClick={() => onRemove(piece.id)}
          disabled={isOnlyPiece}
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
            value={piece.length}
            onChange={(e) => onUpdate(piece.id, 'length', e.target.value)}
          />
        </div>
        <div>
          <label className={styles.label}>
            Breadth ({unit === 'feet' ? 'ft' : 'in'})
          </label>
          <input
            type="number"
            className={styles.input}
            value={piece.breadth}
            onChange={(e) => onUpdate(piece.id, 'breadth', e.target.value)}
          />
        </div>
        <div>
          <label className={styles.label}>
            Thickness (in)
          </label>
          <input
            type="number"
            className={styles.input}
            value={piece.thickness}
            onChange={(e) => onUpdate(piece.id, 'thickness', e.target.value)}
          />
        </div>
        <div>
          <label className={styles.label}>Quantity</label>
          <input
            type="number"
            className={styles.input}
            value={piece.qty}
            onChange={(e) => onUpdate(piece.id, 'qty', e.target.value)}
          />
        </div>
        <div>
          <label className={styles.label}>
            Price / CFT (₹)
          </label>
          <input
            type="number"
            className={`${styles.input} ${styles.priceInput}`}
            value={piece.pricePerCft}
            onChange={(e) => onUpdate(piece.id, 'pricePerCft', e.target.value)}
          />
        </div>
        <div className={styles.cftBox}>
          <span className={styles.cftText}>{piece.cft.toFixed(2)} CFT</span>
          <span className={styles.priceText}>₹{piece.price.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
);
WoodPieceCard.displayName = 'WoodPieceCard';
