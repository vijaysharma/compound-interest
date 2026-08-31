import React from 'react';
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
    <section className="mt-12 border-t border-base-300 pt-10 text-base-content">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Title & Introduction */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 text-balance">
            {title}
          </h2>
          <p className="text-base opacity-80 leading-relaxed">{subtitle}</p>
        </div>
        {/* Key Benefits Grid (if provided) */}
        {keyBenefits && keyBenefits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {keyBenefits.map((benefit, idx) => (
              <div
                key={idx}
                className="card bg-base-200/50 border border-base-300 p-5 rounded-xl space-y-2 shadow-sm"
              >
                <h3 className="font-bold text-base text-primary">{benefit.title}</h3>
                <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        )}
        {/* Formula Box (Featured Snippet Optimized) */}
        {formula && formulaTitle && formulaExplanation && (
          <div className="card bg-base-200/60 border border-base-300 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-bold">{formulaTitle}</h3>
            <div className="bg-base-100 p-4 rounded-lg font-mono text-center text-primary text-base sm:text-lg font-bold border border-primary/20 shadow-inner overflow-x-auto">
              {formula}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm opacity-85">
              {formulaExplanation.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-primary font-mono shrink-0">{item.symbol}:</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Worked Example */}
        {workedExample && (
          <div className="card bg-base-100 border border-base-300 p-6 rounded-xl shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-primary">{workedExample.title}</h3>
            <p className="text-sm opacity-80 leading-relaxed">{workedExample.description}</p>
            <div className="bg-base-200 p-3 rounded-lg text-xs sm:text-sm font-mono text-base-content/90 overflow-x-auto">
              {workedExample.calculation}
            </div>
            <p className="text-sm font-bold text-success flex items-center gap-1.5">
              <span>Result:</span>
              <span>{workedExample.result}</span>
            </p>
          </div>
        )}
        {/* Comparison Table */}
        {comparisonTable && (
          <div className="space-y-3">
            <h3 className="text-xl font-bold">Comparative Analysis</h3>
            <div className="overflow-x-auto rounded-xl border border-base-300">
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
        {/* Accordion FAQs (Targeting Google People Also Ask & Featured Snippets) */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group border border-base-300 rounded-xl bg-base-100 p-4 open:bg-base-200/40 transition-colors shadow-xs"
              >
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center text-sm sm:text-base select-none">
                  <span>{faq.question}</span>
                  <span className="text-primary group-open:rotate-180 transition-transform font-bold text-lg">
                    &darr;
                  </span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm opacity-80 leading-relaxed border-t border-base-300/50 pt-3">
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
