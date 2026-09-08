import { useEffect, useRef, useState } from 'react';
import Tabs from '../components/Tabs';
import MutualFund from './lumpsum';
import RD from './rd';
import FD from './fd';
import InflationRates from './inflationRates';
import PPPExchangeRate from './pppExchangeRate';
import FixedRateSWP from './fixedRateSwp';
import { useAuth } from '../context/useAuth';
import styles from './InvestmentDetails.module.scss';
const isApiTrackedTab = (tabId: string, isDesktop: boolean) => {
  return isDesktop ? tabId === '3' || tabId === '4' : tabId === '4' || tabId === '6';
};
const InvestmentDetails = () => {
  const { trackUsage, isBlocked } = useAuth();
  const getStoredId = (): string => window.localStorage.getItem('aid') || '1';
  const [activeId, setActiveId] = useState(() => getStoredId());
  const [screenWidth] = useState(() => window.innerWidth);
  const prevIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (isBlocked) return;
    if (prevIdRef.current !== activeId) {
      prevIdRef.current = activeId;
      if (isApiTrackedTab(activeId, screenWidth >= 1024)) {
        void trackUsage();
      }
    }
  }, [activeId, trackUsage, isBlocked, screenWidth]);
  return (
    <div id="container" className={styles.container}>
      {screenWidth >= 1024 ? (
        <Tabs name="tab" activeId={activeId} setActiveId={setActiveId} type="tabs-border">
          <div id="1" data-label="Lumpsum">
            <div className={styles.tabContentSingle}>
              <FD />
            </div>
          </div>
          <div id="2" data-label="SIP & SWP">
            <div className={styles.tabContentRow}>
              <RD title="Recurring Deposit" className={styles.tabCol} />
              <FixedRateSWP title="Systematic Withdrwal Plan" className={styles.tabCol} />
            </div>
          </div>
          <div id="3" data-label="Inflation & PPP">
            <div className={styles.tabContentRow}>
              <InflationRates title="Inflation" className={styles.tabCol} />
              <PPPExchangeRate title="Purchasing Power Parity" className={styles.tabCol} />
            </div>
          </div>
          <div id="4" data-label="MF">
            <div className={styles.tabContentWide}>
              <MutualFund />
            </div>
          </div>
        </Tabs>
      ) : (
        <Tabs name="tab" activeId={activeId} setActiveId={setActiveId}>
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
