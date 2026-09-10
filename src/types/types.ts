import { ReactElement, SetStateAction } from 'react';
export interface DisplayType {
  primaryAmount: number;
  primarySub?: string;
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
  ) => void | React.Dispatch<SetStateAction<number>> | React.Dispatch<SetStateAction<string>>;
  inputAmount: string;
  setInputAmount: React.Dispatch<SetStateAction<string>>;
  currencySymbol?: string;
  inputSizePrefix?: string;
  stepData: ButtonDataType[];
  stepSizePrefix?: string;
  locale?: string;
  compact?: boolean;
}
export interface ButtonDataType<T = string> {
  id: string;
  value: T;
  title: string;
}
export interface StepAmountType {
  id: string;
  value: string;
  title: string;
}
export interface JoinedButtonType<T = string> {
  data: ButtonDataType<T>[];
  selectedValue?: T;
  updateSelectedValue: (value: T) => void;
  title?: string;
  sizePrefix?: string;
  className?: string;
  btnClass?: string;
  attached?: 'none' | 'top' | 'bottom' | 'middle';
  compact?: boolean;
}
export interface RT {
  roi?: string;
  tenure: string;
  tenureFormat: 'm' | 'y';
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
/**
 * Props every tab panel must carry. React 19 types default `ReactElement`'s
 * prop parameter to `unknown`, so tab children are explicitly typed.
 */
export interface TabChildProps {
  id: string;
  'data-label'?: string;
}
export type TabChild = ReactElement<TabChildProps>;
export interface TabType {
  name: string;
  child: TabChild;
  selectedId: string;
  setSelectedId?: React.Dispatch<SetStateAction<string>> | ((id: string) => void);
  isVisited?: boolean;
}
export interface TabsType {
  name: string;
  children: TabChild | TabChild[];
  activeId?: string;
  setActiveId?: React.Dispatch<SetStateAction<string>>;
  className?: string;
  type?: string;
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
export interface MFType {
  default?: boolean;
  id: string;
  value: number;
  name: string;
}
export interface MFJSONType {
  default?: boolean;
  schemeCode: number;
  schemeName: string;
}
export interface NavType {
  date: string;
  nav: string;
}
