export const getStyleVariable = (
  selectorClass: string,
  variable?: string
): string => {
  const style = window.getComputedStyle(
    document.querySelector(selectorClass) || document.body
  );
  if (variable) {
    return `oklch(${style.getPropertyValue(variable)})`;
  }
  return style.color;
};
// const myCssColor = "lch(20% 8.5 220.0)";

export const lch_to_rgba = (lchcolor: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (ctx) ctx.fillStyle = lchcolor;
  ctx?.fillRect(0, 0, 1, 1);
  const color = ctx?.getImageData(0, 0, 1, 1).data;

  return `rgba(${color})`;
};
