import React from 'react';
// Classic Minesweeper artwork (red pennant flag, black spiked mine) as inline SVG, so it looks the
// same on every device, unlike emoji. Sized in em to follow the board's font scale.
interface IconProps {
  size?: string;
  'aria-label'?: string;
}
export const FlagIcon = ({ size = '1em', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" role="img" {...rest}>
    <path d="M8.5 2 L8.5 9 L3 6.5 Z" fill="#e01b1b" />
    <rect x="8" y="2" width="1.5" height="9" fill="#111" />
    <rect x="5.5" y="11" width="6.5" height="1.5" fill="#111" />
    <rect x="4" y="12.5" width="9.5" height="1.5" fill="#111" />
  </svg>
);
export const MineIcon = ({ size = '1em', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" role="img" {...rest}>
    <g stroke="#111" strokeWidth="1.4" strokeLinecap="round">
      <line x1="8" y1="1" x2="8" y2="15" />
      <line x1="1" y1="8" x2="15" y2="8" />
      <line x1="3.1" y1="3.1" x2="12.9" y2="12.9" />
      <line x1="12.9" y1="3.1" x2="3.1" y2="12.9" />
    </g>
    <circle cx="8" cy="8" r="4.6" fill="#111" />
    <rect x="5.6" y="5.6" width="1.8" height="1.8" fill="#fff" />
  </svg>
);
