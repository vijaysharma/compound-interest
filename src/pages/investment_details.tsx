import { useEffect, useState } from 'react';
import Tabs from '../components/Tabs';
import MutualFund from './lumpsum';
import RD from './rd';
import FD from './fd';
import InflationRates from './inflationRates';
import PPPExchangeRate from './pppExchangeRate';
import FixedRateSWP from './fixedRateSwp';
import { useAuth } from '../context/useAuth';
const InvestmentDetails = () => {
  const { trackUsage } = useAuth();
  const getStoredId = (): string => window.localStorage.getItem('aid') || '1';
  const [activeId, setActiveId] = useState(() => getStoredId());
  const [screenWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    void trackUsage();
  }, [activeId, trackUsage]);
  return (
    <div id="container" className="w-full max-w-lg lg:max-w-full bg-primary/5 mx-auto py-2">
      {screenWidth >= 1024 ? (
        <Tabs name="tab" activeId={activeId} setActiveId={setActiveId} type="tabs-border">
          <div id="1" data-label="Lumpsum">
            <div className="w-2/3 max-w-lg justify-self-center">
              <FD />
            </div>
          </div>
          <div id="2" data-label="SIP & SWP">
            <div className="w-2/3 max-w-3xl gap-4 flex justify-self-center">
              <RD title="Recurring Deposit" className="grow basis-1" />
              <FixedRateSWP title="Systematic Withdrwal Plan" className="grow basis-1" />
            </div>
          </div>
          <div id="3" data-label="Inflation & PPP">
            <div className="w-2/3 max-w-3xl gap-4 flex justify-self-center">
              <InflationRates title="Inflation" className="grow basis-1" />
              <PPPExchangeRate title="Purchasing Power Parity" className="grow basis-1" />
            </div>
          </div>
          <div id="4" data-label="MF">
            <div className="w-2/3 max-w-3xl justify-self-center">
              <MutualFund />
            </div>
          </div>
        </Tabs>
      ) : (
        <Tabs name="tab" className="calc-tabs" activeId={activeId} setActiveId={setActiveId}>
          <div id="1" data-label="FD">
            <FD />
          </div>
          <div id="2" data-label="RD">
            <RD />
          </div>
          <div id="3" data-label="SWP">
            <FixedRateSWP />
          </div>
          <div id="4" data-label="Inflation">
            <InflationRates />
          </div>
          <div id="5" data-label="PPP">
            <PPPExchangeRate />
          </div>
          <div id="6" data-label="MF">
            <MutualFund />
          </div>
        </Tabs>
      )}
    </div>
  );
};
export default InvestmentDetails;
