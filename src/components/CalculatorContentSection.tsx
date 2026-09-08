import React from 'react';
import styles from './CalculatorContentSection.module.scss';
export interface FAQItem {
  question: string;
  answer: string;
}
export interface ContentSectionProps {
  title: string;
  subtitle: string;
  formulaTitle?: string;
  formula?: string;
  formulaExplanation?: { symbol: string; label: string }[];
  workedExample?: {
    title: string;
    description: string;
    calculation: string;
    result: string;
  };
  comparisonTable?: {
    headers: string[];
    rows: string[][];
  };
  keyBenefits?: { title: string; description: string }[];
  faqs: FAQItem[];
}
export const CalculatorContentSection: React.FC<ContentSectionProps> = ({
  title,
  subtitle,
  formulaTitle,
  formula,
  formulaExplanation,
  workedExample,
  comparisonTable,
  keyBenefits,
  faqs,
}) => {
  return (
    <section className={styles.section}>
      <div className={styles.innerContainer}>
        {/* Title & Introduction */}
        <div>
          <h2 className={styles.heading}>
            {title}
          </h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        {/* Key Benefits Grid (if provided) */}
        {keyBenefits && keyBenefits.length > 0 && (
          <div className={styles.benefitsGrid}>
            {keyBenefits.map((benefit, idx) => (
              <div
                key={idx}
                className={styles.benefitCard}
              >
                <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                <p className={styles.benefitDesc}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        )}
        {/* Formula Box (Featured Snippet Optimized) */}
        {formula && formulaTitle && formulaExplanation && (
          <div className={styles.formulaBox}>
            <h3 className="text-lg font-bold">{formulaTitle}</h3>
            <div className={styles.formulaDisplay}>
              {formula}
            </div>
            <div className={styles.formulaGrid}>
              {formulaExplanation.map((item, idx) => (
                <div key={idx} className={styles.formulaItem}>
                  <span className={styles.formulaSymbol}>{item.symbol}:</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Worked Example */}
        {workedExample && (
          <div className={styles.workedExampleBox}>
            <h3 className="text-lg font-bold text-primary">{workedExample.title}</h3>
            <p className="text-sm opacity-80 leading-relaxed">{workedExample.description}</p>
            <div className={styles.exampleCalculation}>
              {workedExample.calculation}
            </div>
            <p className={styles.exampleResult}>
              <span>Result:</span>
              <span>{workedExample.result}</span>
            </p>
          </div>
        )}
        {/* Comparison Table */}
        {comparisonTable && (
          <div className="space-y-3">
            <h3 className="text-xl font-bold">Comparative Analysis</h3>
            <div className={styles.tableWrapper}>
              <table className="table table-zebra w-full text-sm">
                <thead>
                  <tr className="bg-base-200">
                    {comparisonTable.headers.map((header, i) => (
                      <th key={i} className="font-bold text-xs uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonTable.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-base-200/50">
                      {row.map((cell, j) => (
                        <td key={j} className={j === 0 ? 'font-semibold' : ''}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Accordion FAQs */}
        <div className={styles.faqSection}>
          <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
          <div className={styles.faqList}>
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className={styles.faqDetails}
              >
                <summary className={styles.faqSummary}>
                  <span>{faq.question}</span>
                  <span className="text-primary font-bold text-lg">
                    &darr;
                  </span>
                </summary>
                <p className={styles.faqAnswer}>
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
export default CalculatorContentSection;
