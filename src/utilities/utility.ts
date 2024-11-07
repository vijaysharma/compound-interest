type DurationType = {
  startDate: string;
  endDate: string;
  type?: "Y" | "M" | "D" | "H" | "MM" | "S" | "MS";
  inclusive?: boolean;
};
export const getDuration = ({
  startDate,
  endDate,
  type,
  inclusive = true,
}: DurationType): number => {
  const sDate = new Date(startDate.split("-").reverse().join("-")).getTime();
  const eDate = new Date(endDate.split("-").reverse().join("-")).getTime();
  const dMS = inclusive ? eDate - sDate + 86400000 : eDate - sDate;

  let result = 0;
  switch (type) {
    case "Y":
      result = dMS / (1000 * 60 * 60 * 24 * 365);
      break;
    case "M":
      result = dMS / (1000 * 60 * 60 * 24 * 30);
      break;
    case "D":
      result = dMS / (1000 * 60 * 60 * 24);
      break;
    case "H":
      result = dMS / (1000 * 60 * 60);
      break;
    case "MM":
      result = dMS / (1000 * 60);
      break;
    case "S":
      result = dMS / 1000;
      break;
    case "MS":
      result = dMS;
      break;
    default:
      result = dMS / (1000 * 60 * 60 * 24 * 365);
      break;
  }
  return result;
};
