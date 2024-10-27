import { ReactElement, SetStateAction } from "react";

export interface DisplayType {
  primaryAmount: number;
  title?: string;
  secondaryInfo?: {
    title: string;
    amount: number;
  };
  colorClass?: string;
  currencySymbol?: string;
  locale?: string;
}

export interface InputType {
  title?: string;
  className?: string;
  type?: string;
  typeData?: ButtonDataType[];
  typeSizePrefix?: string;
  setType?: (
    amnt: string
  ) =>
    | void
    | React.Dispatch<SetStateAction<number>>
    | React.Dispatch<SetStateAction<string>>;
  inputAmount: string;
  setInputAmount: React.Dispatch<SetStateAction<string>>;
  currencySymbol?: string;
  inputSizePrefix?: string;
  stepData: ButtonDataType[];
  stepSizePrefix?: string;
  locale?: string;
}

export interface ButtonDataType {
  id: string;
  value: string;
  title: string;
}

export interface JoinedButtonType {
  data: ButtonDataType[];
  selectedValue: string;
  updateSelectedValue: (
    amnt: string
  ) =>
    | void
    | React.Dispatch<SetStateAction<string>>
    | React.Dispatch<SetStateAction<number>>;
  title?: string;
  sizePrefix?: string;
  className?: string;
  btnClass?: string;
}

export interface RT {
  roi?: string;
  tenure: string;
  tenureFormat: "m" | "y";
}
export interface RateOfInterestType {
  rt: RT;
  setRt: React.Dispatch<SetStateAction<RT>>;
  title?: string;
  className?: string;
}

export interface ROIType {
  rt: string;
  setRt: React.Dispatch<SetStateAction<string>>;
  title?: string;
  className?: string;
}

export interface TabType {
  name: string;
  child: ReactElement;
  selectedId: string;
  setSelectedId: React.Dispatch<SetStateAction<string>>;
}

export interface TabsType {
  name: string;
  children: ReactElement[];
  activeId: string;
  className: string;
}

export interface TenureType {
  rt: RT;
  setRt: React.Dispatch<SetStateAction<RT>>;
  className: string;
}

export interface INFLATION_TYPE {
  Year: number;
  id: number;
  India: string;
  EU: string;
  USA: string;
  World: string;
}

export interface PPPDataType {
  indicator: {
    id: string;
    value: string;
  };
  country: {
    id: string;
    value: string;
  };
  countryiso3code: string;
  date: string;
  value: number;
  unit: string;
  obs_status: string;
  decimal: number;
}

export interface CountryPPPType {
  [key: number]: number;
  currencyCode: string;
  currencyName: string;
}

export interface ExchangeRateType {
  [key: string]: number;
}
