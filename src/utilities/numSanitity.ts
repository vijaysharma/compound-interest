export const sanctnum = (inputValue: string | number): number => {
  // parseFloat the input value
  let intValue =
    typeof inputValue === "string" ? parseFloat(inputValue) : inputValue;
  // check if the input value is finite or not
  intValue = isFinite(intValue) ? intValue : 0;
  return intValue;
};
