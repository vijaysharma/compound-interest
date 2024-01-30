export const sanctnum = (inputValue) => {
  return isNaN(parseFloat(inputValue)) ? 0 : parseFloat(inputValue);
};
