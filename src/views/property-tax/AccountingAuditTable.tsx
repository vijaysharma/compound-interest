import React from 'react';
import { FiInfo } from 'react-icons/fi';
import type { PropertyTaxComparison } from '../../data/propertyTaxData';
import styles from '../PropertyTax.module.scss';
interface AccountingAuditTableProps {
  salePrice: string;
  transferExpenses: string;
  purchasePrice: string;
  improvementCost: string;
  sec54Exemption: string;
  sec54ecExemption: string;
  comparison: PropertyTaxComparison;
}
export function AccountingAuditTable({
  salePrice, transferExpenses, purchasePrice, improvementCost,
  sec54Exemption, sec54ecExemption, comparison,
}: AccountingAuditTableProps) {
  const currencySymbol = '₹';
  const numSale = parseFloat(salePrice) || 0;
  const numExpenses = parseFloat(transferExpenses) || 0;
  const numPurchase = parseFloat(purchasePrice) || 0;
  const numImprovement = parseFloat(improvementCost) || 0;
  const numExemptions = (parseFloat(sec54Exemption) || 0) + (parseFloat(sec54ecExemption) || 0);
  return (
    <>
      <div className={styles.tableCard}>
        <div className={styles.tableTitle}>Accounting Breakdown Comparison</div>
        <table className={styles.auditTable}>
          <thead>
            <tr>
              <th>Particulars</th>
              <th className={styles.textRight}>Old Rule (Indexation)</th>
              <th className={styles.textRight}>New Rule (Flat 12.5%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Full Value of Consideration (Sale Price)</td>
              <td className={styles.textRight}>{currencySymbol}{numSale.toLocaleString('en-IN')}</td>
              <td className={styles.textRight}>{currencySymbol}{numSale.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Less: Transfer Expenses</td>
              <td className={styles.textRight}>-{currencySymbol}{numExpenses.toLocaleString('en-IN')}</td>
              <td className={styles.textRight}>-{currencySymbol}{numExpenses.toLocaleString('en-IN')}</td>
            </tr>
            <tr className={styles.boldRow}>
              <td>Net Sale Consideration</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.netSaleConsideration.toLocaleString('en-IN')}</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.netSaleConsideration.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>
                Cost of Acquisition
                {comparison.isLongTerm && (
                  <span className={styles.indexedSubtitle}>
                    Old: Indexed ({comparison.purchaseCII} &rarr; {comparison.saleCII})
                  </span>
                )}
              </td>
              <td className={styles.textRight}>{currencySymbol}{comparison.oldRegime.indexedAcquisitionCost.toLocaleString('en-IN')}</td>
              <td className={styles.textRight}>{currencySymbol}{numPurchase.toLocaleString('en-IN')}</td>
            </tr>
            {numImprovement > 0 && (
              <tr>
                <td>Cost of Improvement (Renovation)</td>
                <td className={styles.textRight}>{currencySymbol}{comparison.oldRegime.indexedImprovementCost.toLocaleString('en-IN')}</td>
                <td className={styles.textRight}>{currencySymbol}{numImprovement.toLocaleString('en-IN')}</td>
              </tr>
            )}
            <tr className={styles.boldRow}>
              <td>Gross Capital Gain</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.oldRegime.grossGain.toLocaleString('en-IN')}</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.newRegime.grossGain.toLocaleString('en-IN')}</td>
            </tr>
            {numExemptions > 0 && (
              <tr>
                <td>Less: Section 54 &amp; 54EC Exemptions</td>
                <td className={styles.textRight}>-{currencySymbol}{comparison.oldRegime.exemptions.toLocaleString('en-IN')}</td>
                <td className={styles.textRight}>-{currencySymbol}{comparison.newRegime.exemptions.toLocaleString('en-IN')}</td>
              </tr>
            )}
            <tr className={styles.boldRow}>
              <td>Net Taxable Capital Gain</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.oldRegime.taxableGain.toLocaleString('en-IN')}</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.newRegime.taxableGain.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Base Tax Rate</td>
              <td className={styles.textRight}>20.00%</td>
              <td className={styles.textRight}>12.50%</td>
            </tr>
            <tr>
              <td>Base Tax Amount</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.oldRegime.baseTax.toLocaleString('en-IN')}</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.newRegime.baseTax.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Add: 4% Health &amp; Education Cess</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.oldRegime.cess.toLocaleString('en-IN')}</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.newRegime.cess.toLocaleString('en-IN')}</td>
            </tr>
            <tr className={styles.boldRow}>
              <td>Total Tax Payable</td>
              <td className={`${styles.textRight} ${comparison.recommendedOption === 'old' ? styles.winnerCell : ''}`}>
                {currencySymbol}{comparison.oldRegime.totalTax.toLocaleString('en-IN')}
              </td>
              <td className={`${styles.textRight} ${comparison.recommendedOption === 'new' ? styles.winnerCell : ''}`}>
                {currencySymbol}{comparison.newRegime.totalTax.toLocaleString('en-IN')}
              </td>
            </tr>
            <tr className={styles.boldRow}>
              <td>Net In-Hand Proceeds</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.oldRegime.netInHand.toLocaleString('en-IN')}</td>
              <td className={styles.textRight}>{currencySymbol}{comparison.newRegime.netInHand.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className={styles.disclaimerBanner}>
        <FiInfo className={styles.disclaimerIcon} />
        <strong>Tax Compliance Note:</strong> As per the Finance (No. 2) Act 2024, the option to
        choose between 20% with indexation and 12.5% without indexation is exclusively available
        to resident individuals and HUFs for immovable property purchased before July 23, 2024.
      </div>
    </>
  );
}
