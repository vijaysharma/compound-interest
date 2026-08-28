import Tabs from '../components/Tabs';
import Lumpsum from './lumpsum';
import SystemacticWithdrawalPlan from './systematic_withdrawal_plan';
import Inflation from './inflation';
import { useState } from 'react';
import MutualFund from './mutual_fund.tsx';
import Login from './login';
import SystematicInvestmentPlan from './systematic_investment_plan';
import PurchasingPowerParity from './purchasing_power_parity';
const Home = () => {
  const getStoredId = (): string => window.localStorage.getItem('aid') || '1';
  const [activeId, setActiveId] = useState(() => getStoredId());
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('at') || '');
  const [screenWidth] = useState(() => window.innerWidth);
  const [showDate, setShowDate] = useState(() => window.innerWidth >= 1024);
  return (
    <>
      <div id="container" className="w-full max-w-lg lg:max-w-full bg-primary/5 mx-auto">
        {accessToken === import.meta.env.VITE_ACCESS_TOKEN ? (
          screenWidth >= 1024 ? (
            <Tabs name="tab" activeId={activeId} setActiveId={setActiveId} type="tabs-border">
              <div id="1" data-label="Lumpsum">
                <div className="w-2/3 max-w-lg justify-self-center">
                  <Lumpsum />
                </div>
              </div>
              <div id="2" data-label="SIP & SWP">
                <div className="w-2/3 max-w-3xl gap-4 flex justify-self-center">
                  <SystematicInvestmentPlan
                    title="Systematic Investment Plan"
                    className="grow basis-1"
                  />
                  <SystemacticWithdrawalPlan
                    title="Systematic Withdrwal Plan"
                    className="grow basis-1"
                  />
                </div>
              </div>
              <div id="3" data-label="Inflation & PPP">
                <div className="w-2/3 max-w-3xl gap-4 flex justify-self-center">
                  <Inflation title="Inflation" className="grow basis-1" />
                  <PurchasingPowerParity title="Purchasing Power Parity" className="grow basis-1" />
                </div>
              </div>
              <div id="4" data-label="MF">
                <div className="w-2/3 max-w-3xl justify-self-center">
                  <MutualFund showDate={showDate} setShowDate={setShowDate} />
                </div>
              </div>
            </Tabs>
          ) : (
            <Tabs name="tab" className="calc-tabs" activeId={activeId} setActiveId={setActiveId}>
              <div id="1" data-label="Lumpsum">
                <Lumpsum />
              </div>
              <div id="2" data-label="SIP">
                <SystematicInvestmentPlan />
              </div>
              <div id="3" data-label="SWP">
                <SystemacticWithdrawalPlan />
              </div>
              <div id="4" data-label="Inflation">
                <Inflation />
              </div>
              <div id="5" data-label="PPP">
                <PurchasingPowerParity />
              </div>
              <div id="6" data-label="MF">
                <MutualFund showDate={showDate} setShowDate={setShowDate} />
              </div>
            </Tabs>
          )
        ) : (
          <Tabs name="tab2">
            <Login action={setAccessToken} />
          </Tabs>
        )}
      </div>
    </>
  );
};
export default Home;
