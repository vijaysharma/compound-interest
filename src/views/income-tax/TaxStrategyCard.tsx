import React from 'react';
import { FiAward, FiCpu, FiSend } from 'react-icons/fi';
import styles from '../IncomeTaxCalculator.module.scss';
interface TaxStrategyCardProps {
  hasTaxPro: boolean;
  strategyLoading: boolean;
  strategyAdvice: string | null;
  strategyQuestion: string;
  setStrategyQuestion: (q: string) => void;
  showUpgradeGate: boolean;
  onGenerateAdvice: (question?: string) => Promise<void>;
  onUpgrade: () => void;
}
export const TaxStrategyCard: React.FC<TaxStrategyCardProps> = ({
  hasTaxPro,
  strategyLoading,
  strategyAdvice,
  strategyQuestion,
  setStrategyQuestion,
  showUpgradeGate,
  onGenerateAdvice,
  onUpgrade,
}) => {
  return (
    <section className={styles.aiCard}>
      <div className={styles.aiHeader}>
        <div className={styles.aiTitleGroup}>
          <FiCpu className={styles.aiIcon} />
          <h2 className={styles.aiTitle}>Tax Strategy &amp; Optimization Advisory</h2>
        </div>
        <span className={styles.aiBadge}>
          {hasTaxPro ? 'Tax Pro Active' : 'Tax Pro Feature'}
        </span>
      </div>
      <p className={styles.aiDesc}>
        Get institutional-grade tax planning tailored specifically to your financial figures.
        Analyzes your salary, second business, PPF earnings, capital gains harvesting, and all Section
        80 deductions.
      </p>
      <div>
        <button
          type="button"
          disabled={strategyLoading}
          onClick={() => void onGenerateAdvice()}
          className={styles.aiActionBtn}
        >
          <FiCpu />
          <span>
            {strategyLoading
              ? 'Generating Optimization Strategy...'
              : 'Generate Tax Optimization Strategy'}
          </span>
        </button>
        <div className={styles.aiQuestionRow}>
          <input
            type="text"
            value={strategyQuestion}
            onChange={(e) => setStrategyQuestion(e.target.value)}
            placeholder="Ask specific tax questions (e.g., 'What if I invest ₹50k in NPS?', 'How should I treat freelance income?')"
            className={styles.aiQuestionInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void onGenerateAdvice(strategyQuestion);
              }
            }}
          />
          <button
            type="button"
            disabled={strategyLoading || !strategyQuestion.trim()}
            onClick={() => void onGenerateAdvice(strategyQuestion)}
            className={styles.aiAskBtn}
          >
            <FiSend className={styles.iconMrSmall} /> Consult Engine
          </button>
        </div>
        {showUpgradeGate && !hasTaxPro && (
          <div className={styles.taxProTeaser}>
            <div>
              <div className={styles.proTeaserTitle}>Unlock Personalized Tax Strategy Advisory</div>
              <div className={styles.proTeaserSub}>
                Institutional-grade tax optimization with multi-source planning, custom deduction
                modeling, and continuous savings recommendations is exclusive to{' '}
                <strong>Tax Pro</strong> (₹129/mo or ₹999/yr).
              </div>
            </div>
            <button
              type="button"
              onClick={onUpgrade}
              className={styles.taxProUpgradeBtn}
            >
              Upgrade to Tax Pro &rarr;
            </button>
          </div>
        )}
        {strategyAdvice && (
          <div className={styles.aiResponseBox}>
            <div className={styles.advisoryHeader}>
              <FiAward />
              <span>Customized Tax Advisory Report</span>
            </div>
            <div className={styles.preWrap}>{strategyAdvice}</div>
          </div>
        )}
      </div>
    </section>
  );
};
