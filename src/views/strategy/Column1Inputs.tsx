import React from 'react';
import { Streamline } from './types';
import { StreamlineManager } from './StreamlineManager';
import { StepALumpsumSection } from './StepALumpsumSection';
import { SwpConfigSubColumn } from './SwpConfigSubColumn';
import { SipConfigSubColumn } from './SipConfigSubColumn';
import { StepCTopUpsSection } from './StepCTopUpsSection';
import styles from './StrategyCalculator.module.scss';
interface Column1InputsProps {
  streamlines: Streamline[];
  activeId: string;
  activeStreamline: Streamline;
  onSelectStreamline: (id: string) => void;
  onUpdateActive: (updater: Partial<Streamline>) => void;
  onSave: () => void;
  onDuplicate: () => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  isSaved: boolean;
}
export const Column1Inputs: React.FC<Column1InputsProps> = ({
  streamlines,
  activeId,
  activeStreamline,
  onSelectStreamline,
  onUpdateActive,
  onSave,
  onDuplicate,
  onAdd,
  onDelete,
  isSaved,
}) => {
  return (
    <div className={styles.column1Container}>
      <div className={styles.columnHeader}>
        <span className={styles.columnBadge}>Column 1</span>
        <h2 className={styles.columnTitle}>Strategy Inputs &amp; Controls</h2>
        <p className={styles.columnSubtitle}>Configure capital tranches, redemption triggers &amp; streamlines</p>
      </div>
      <StreamlineManager
        streamlines={streamlines}
        activeId={activeId}
        onSelectStreamline={onSelectStreamline}
        onUpdateName={(name) => onUpdateActive({ name })}
        onSave={onSave}
        onDuplicate={onDuplicate}
        onAdd={onAdd}
        onDelete={onDelete}
        isSaved={isSaved}
      />
      <div className={styles.column1Scrollable}>
        <StepALumpsumSection
          investmentDate={activeStreamline.investmentDate}
          onInvestmentDateChange={(date) => onUpdateActive({ investmentDate: date })}
          investmentAmount={activeStreamline.investmentAmount}
          onInvestmentAmountChange={(amount) => onUpdateActive({ investmentAmount: amount })}
          sourceFunds={activeStreamline.sourceFunds}
          onUpdateSourceFunds={(sourceFunds) => onUpdateActive({ sourceFunds })}
        />
        <div className={styles.subCardContainer}>
          <SwpConfigSubColumn
            swpConfig={activeStreamline.swpConfig}
            onUpdateSwpConfig={(swpConfig) => onUpdateActive({ swpConfig })}
          />
        </div>
        <div className={styles.subCardContainer}>
          <SipConfigSubColumn
            sipConfig={activeStreamline.sipConfig}
            onUpdateSipConfig={(sipConfig) => onUpdateActive({ sipConfig })}
            sipFunds={activeStreamline.sipFunds}
            onUpdateSipFunds={(sipFunds) => onUpdateActive({ sipFunds })}
          />
        </div>
        <StepCTopUpsSection
          topUps={activeStreamline.topUps}
          onAddTopUp={(date, amount, note) =>
            onUpdateActive({
              topUps: [...activeStreamline.topUps, { id: `tu-${Date.now()}`, date, amount, note }],
            })
          }
          onRemoveTopUp={(id) =>
            onUpdateActive({
              topUps: activeStreamline.topUps.filter((t) => t.id !== id),
            })
          }
          durationYears={activeStreamline.durationYears}
          onDurationChange={(durationYears) => onUpdateActive({ durationYears })}
        />
      </div>
    </div>
  );
};
