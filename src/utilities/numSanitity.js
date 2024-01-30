export const sanctnum = (inputValue) => {
  // parseFloat the input value
  inputValue = parseFloat(inputValue) ? parseFloat(inputValue) : 0;
  // check if the input value is finite or not
  inputValue = isFinite(inputValue) ? inputValue : 0;
  return inputValue;
};
