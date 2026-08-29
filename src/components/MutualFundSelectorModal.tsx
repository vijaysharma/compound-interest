import JoinedButtonGroup from './JoinedButtonGroup';
import { MFType } from '../types/types';
interface PinnedFund {
  schemeCode: string;
  schemeName: string;
  color: string;
}
interface MutualFundSelectorModalProps {
  open: boolean;
  onClose: () => void;
  searchKey: string;
  setSearchKey: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  selectedGrowth: string;
  setSelectedGrowth: (value: string) => void;
  funds: MFType[];
  pinnedFunds: PinnedFund[];
  togglePinFund: (fund: MFType) => void;
}
const MutualFundSelectorModal = ({
  open,
  onClose,
  searchKey,
  setSearchKey,
  selectedType,
  setSelectedType,
  selectedGrowth,
  setSelectedGrowth,
  funds,
  pinnedFunds,
  togglePinFund,
}: MutualFundSelectorModalProps) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mutual-fund-selector-title"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/40"
        aria-label="Close mutual fund selector"
        onClick={onClose}
      />
      <section className="relative z-10 flex h-[90dvh] w-full max-w-2xl flex-col bg-base-100 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="mutual-fund-selector-title" className="text-lg font-semibold">
            Select mutual funds
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-square"
            aria-label="Close"
            onClick={onClose}
          >
            <span aria-hidden="true" className="text-xl leading-none">
              &times;
            </span>
          </button>
        </div>
        <div className="mb-2 flex gap-2">
          <JoinedButtonGroup
            data={[
              { id: 'direct', title: 'Direct', value: 'Direct' },
              { id: 'regular', title: 'Regular', value: '!Direct' },
            ]}
            selectedValue={selectedType}
            updateSelectedValue={setSelectedType}
            sizePrefix="sm"
          />
          <JoinedButtonGroup
            data={[
              { id: 'growth', title: 'Growth', value: 'Growth' },
              { id: 'dividend', title: 'Dividend', value: 'Dividend' },
              { id: 'idcw', title: 'IDCW', value: 'IDCW' },
            ]}
            selectedValue={selectedGrowth}
            updateSelectedValue={setSelectedGrowth}
            sizePrefix="sm"
          />
        </div>
        <input
          type="text"
          placeholder="Search Mutual Funds..."
          className="input input-sm input-primary mb-2 w-full"
          value={searchKey}
          onChange={(event) => setSearchKey(event.target.value.replace(/[.*+?^${}()|[\]\\]/g, ''))}
          autoFocus
        />
        {pinnedFunds.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1" aria-label="Selected mutual funds">
            {pinnedFunds.map((fund, index) => (
              <div
                key={fund.schemeCode}
                className="badge badge-primary badge-outline max-w-full gap-1 py-2 text-left"
                title={`Remove ${fund.schemeName}`}
                onClick={() =>
                  togglePinFund({
                    value: Number(fund.schemeCode),
                    name: fund.schemeName,
                    id: fund.schemeCode,
                  })
                }
              >
                <span className="truncate">
                  {index + 1}. {fund.schemeName}
                </span>
                <span aria-hidden="true">&times;</span>
              </div>
            ))}
          </div>
        )}
        <div className="mf-container min-h-0 flex-1 overflow-y-auto">
          {funds.length > 0 ? (
            funds.map((fund) => {
              const schemeCode = String(fund.value);
              const pinnedFund = pinnedFunds.find((pinned) => pinned.schemeCode === schemeCode);
              const isPinned = Boolean(pinnedFund);
              return (
                <label
                  key={fund.id}
                  className={`label cursor-pointer justify-start gap-2 px-0 py-1 ${isPinned ? 'font-semibold' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={isPinned}
                    disabled={!isPinned && pinnedFunds.length >= 8}
                    onChange={() => void togglePinFund(fund)}
                  />
                  {pinnedFund && (
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: pinnedFund.color }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex-1 text-sm">{fund.name}</span>
                </label>
              );
            })
          ) : (
            <p className="py-4 text-center text-sm opacity-60">
              Enter a search term to find mutual funds.
            </p>
          )}
        </div>
        <button type="button" className="btn btn-primary mt-3 w-full" onClick={onClose}>
          Done
        </button>
      </section>
    </div>
  );
};
export default MutualFundSelectorModal;
