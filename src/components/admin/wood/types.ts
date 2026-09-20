export interface WoodPiece {
  id: string;
  length: string;
  breadth: string;
  thickness: string;
  qty: string;
  pricePerCft: string;
}
export interface WoodPieceWithCalc extends WoodPiece {
  cft: number;
  price: number;
}
export interface SavedState {
  unit: 'inches' | 'feet';
  pieces: WoodPiece[];
  cutsCharge: string;
  labourCharge: string;
  shippingCharge: string;
}
