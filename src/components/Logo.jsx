import { useEffect, useState } from "react";
const themes = [
  "fantasy",
  "light",
  "emerald",
  "corporate",
  "lofi",
  "fantasy",
  "wireframe",
  "luxury",
  "cmyk",
  "lemonade",
  "fantasy",
  "night",
  "winter",
  "dim",
  "nord",
  "fantasy",
];
const Logo = () => {
  const getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  const [theme, setTheme] = useState(localStorage.getItem("th") || "fantasy");
  useEffect(() => {
    window.document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("th", theme);
  }, [theme]);
  return (
    <div className="text-center py-2">
      <svg
        version="1.0"
        xmlns="http://www.w3.org/2000/svg"
        width="60"
        height="32"
        viewBox="0 0 139.000000 126.000000"
        preserveAspectRatio="xMidYMid meet"
        className="inline-block animate-jiggle hover:animate-wiggle"
        fill="oklch(var(--p))"
        onClick={(e) => {
          setTheme(themes[getRandomNumber(0, themes.length)]);
        }}
      >
        <g
          transform="translate(0.000000,126.000000) scale(0.100000,-0.100000)"
          stroke="none"
        >
          <path
            d="M222 1234 c-23 -10 -34 -54 -22 -90 11 -32 71 -94 91 -94 6 0 8 16 4
44 -6 36 -3 52 16 85 12 23 20 44 16 47 -9 9 -89 15 -105 8z"
          />
          <path
            d="M1068 1233 c-23 -6 -23 -14 3 -58 17 -28 20 -44 14 -80 -7 -53 1 -56
46 -18 58 49 73 129 29 153 -19 10 -61 11 -92 3z"
          />
          <path
            d="M401 1161 c-37 -37 -24 -95 35 -168 l36 -43 215 2 216 3 39 57 c49
72 58 118 29 147 -34 34 -95 24 -243 -42 l-56 -26 -91 40 c-118 52 -152 58
-180 30z"
          />
          <path
            d="M277 1023 c-26 -26 16 -73 65 -73 33 0 34 5 8 48 -19 30 -55 43 -73
25z"
          />
          <path
            d="M1030 998 c-24 -40 -14 -55 32 -42 28 8 33 14 33 39 0 45 -38 47 -65
3z"
          />
          <path
            d="M472 918 c-16 -16 -15 -43 2 -57 9 -8 78 -11 226 -9 190 3 214 5 224
21 8 12 8 22 0 35 -10 15 -34 17 -225 20 -159 2 -218 -1 -227 -10z"
          />
          <path
            d="M255 901 c-120 -73 -224 -284 -213 -431 4 -55 34 -130 55 -137 6 -2
18 28 28 69 24 98 63 192 109 260 37 56 148 168 167 168 5 0 9 20 9 45 l0 45
-62 0 c-44 0 -72 -6 -93 -19z"
          />
          <path
            d="M970 861 c0 -57 1 -59 32 -72 94 -39 203 -203 248 -373 13 -48 28
-85 33 -83 21 7 51 82 55 137 8 114 -53 274 -140 366 -67 71 -93 84 -168 84
l-60 0 0 -59z"
          />
          <path
            d="M403 745 c-232 -293 -292 -532 -163 -649 63 -56 116 -68 350 -73 495
-12 606 30 604 232 -1 63 -8 98 -32 162 -35 95 -117 238 -195 338 l-54 70
-221 3 -222 2 -67 -85z m527 -75 l0 -30 -86 0 -85 0 20 -25 c11 -14 23 -39 26
-55 6 -29 8 -30 66 -30 59 0 59 0 59 -30 0 -30 0 -30 -59 -30 -59 0 -60 0 -71
-34 -23 -70 -80 -116 -164 -131 l-38 -8 59 -61 c33 -33 86 -92 118 -131 l58
-70 -78 -3 -78 -3 -31 38 c-17 21 -68 79 -113 130 -77 85 -83 95 -83 135 l0
44 82 11 c74 10 85 14 112 44 l30 34 -112 3 -112 3 0 29 0 30 105 0 c117 0
126 6 71 50 -10 8 -50 16 -95 20 l-76 5 -3 48 -3 47 240 0 241 0 0 -30z"
          />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
