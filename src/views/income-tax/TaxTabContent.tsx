import React from 'react';
import { TaxInputTab } from './TabsNav';
import { SalaryTab } from './SalaryTab';
import { BusinessTab } from './BusinessTab';
import { HousePropertyTab } from './HousePropertyTab';
import { CapitalGainsTab } from './CapitalGainsTab';
import { InterestTab } from './InterestTab';
import { DeductionsTab } from './DeductionsTab';
import { useIncomeTaxInputs } from './useIncomeTaxInputs';
interface TaxTabContentProps {
  activeTab: TaxInputTab;
  taxState: ReturnType<typeof useIncomeTaxInputs>;
  currencySymbol: string;
}
export const TaxTabContent: React.FC<TaxTabContentProps> = ({
  activeTab,
  taxState,
  currencySymbol,
}) => {
  const {
    financialYear,
    isSalaried,
    setIsSalaried,
    grossSalary,
    setGrossSalary,
    basicSalary,
    setBasicSalary,
    cityCategory,
    setCityCategory,
    hraReceived,
    setHraReceived,
    rentPaid,
    setRentPaid,
    professionalTax,
    setProfessionalTax,
    exemptAllowances,
    setExemptAllowances,
    useCustomStdDeduction,
    setUseCustomStdDeduction,
    customStdDeduction,
    setCustomStdDeduction,
    businessIncome,
    setBusinessIncome,
    isSelfOccupied,
    setIsSelfOccupied,
    rentalIncome,
    setRentalIncome,
    municipalTaxes,
    setMunicipalTaxes,
    homeLoanInterestProperty,
    setHomeLoanInterestProperty,
    equityStcg,
    setEquityStcg,
    equityLtcg,
    setEquityLtcg,
    otherCapitalGains,
    setOtherCapitalGains,
    savingsInterest,
    setSavingsInterest,
    fdInterest,
    setFdInterest,
    ppfInterest,
    setPpfInterest,
    otherIncome,
    setOtherIncome,
    deductions,
  } = taxState;
  switch (activeTab) {
    case 'salary':
      return (
        <SalaryTab
          isSalaried={isSalaried}
          setIsSalaried={setIsSalaried}
          grossSalary={grossSalary}
          setGrossSalary={setGrossSalary}
          basicSalary={basicSalary}
          setBasicSalary={setBasicSalary}
          cityCategory={cityCategory}
          setCityCategory={setCityCategory}
          hraReceived={hraReceived}
          setHraReceived={setHraReceived}
          rentPaid={rentPaid}
          setRentPaid={setRentPaid}
          professionalTax={professionalTax}
          setProfessionalTax={setProfessionalTax}
          exemptAllowances={exemptAllowances}
          setExemptAllowances={setExemptAllowances}
          useCustomStdDeduction={useCustomStdDeduction}
          setUseCustomStdDeduction={setUseCustomStdDeduction}
          customStdDeduction={customStdDeduction}
          setCustomStdDeduction={setCustomStdDeduction}
          financialYear={financialYear}
        />
      );
    case 'business':
      return (
        <BusinessTab
          businessIncome={businessIncome}
          setBusinessIncome={setBusinessIncome}
        />
      );
    case 'house':
      return (
        <HousePropertyTab
          isSelfOccupied={isSelfOccupied}
          setIsSelfOccupied={setIsSelfOccupied}
          homeLoanInterestProperty={homeLoanInterestProperty}
          setHomeLoanInterestProperty={setHomeLoanInterestProperty}
          rentalIncome={rentalIncome}
          setRentalIncome={setRentalIncome}
          municipalTaxes={municipalTaxes}
          setMunicipalTaxes={setMunicipalTaxes}
        />
      );
    case 'capital_gains':
      return (
        <CapitalGainsTab
          equityStcg={equityStcg}
          setEquityStcg={setEquityStcg}
          equityLtcg={equityLtcg}
          setEquityLtcg={setEquityLtcg}
          otherCapitalGains={otherCapitalGains}
          setOtherCapitalGains={setOtherCapitalGains}
        />
      );
    case 'interest':
      return (
        <InterestTab
          ppfInterest={ppfInterest}
          setPpfInterest={setPpfInterest}
          savingsInterest={savingsInterest}
          setSavingsInterest={setSavingsInterest}
          fdInterest={fdInterest}
          setFdInterest={setFdInterest}
          otherIncome={otherIncome}
          setOtherIncome={setOtherIncome}
        />
      );
    case 'deductions':
      return <DeductionsTab deductions={deductions} currencySymbol={currencySymbol} />;
    default:
      return null;
  }
};
