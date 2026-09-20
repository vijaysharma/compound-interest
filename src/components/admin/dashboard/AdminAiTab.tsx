'use client';
import React, { FormEvent } from 'react';
import { FiCpu } from 'react-icons/fi';
import styles from '../../../views/Admin.module.scss';
export interface AdminAiTabProps {
  aiEnabled: boolean;
  aiProvider: string;
  aiModel: string;
  aiApiKey: string;
  aiHasKey: boolean;
  aiSystemPrompt: string;
  busy: string | null;
  onAiEnabledChange: (val: boolean) => void;
  onAiProviderChange: (val: string) => void;
  onAiModelChange: (val: string) => void;
  onAiApiKeyChange: (val: string) => void;
  onAiSystemPromptChange: (val: string) => void;
  onSubmit: (e: FormEvent) => void;
}
export const AdminAiTab: React.FC<AdminAiTabProps> = React.memo(
  ({
    aiEnabled,
    aiProvider,
    aiModel,
    aiApiKey,
    aiHasKey,
    aiSystemPrompt,
    busy,
    onAiEnabledChange,
    onAiProviderChange,
    onAiModelChange,
    onAiApiKeyChange,
    onAiSystemPromptChange,
    onSubmit,
  }) => (
    <div className={styles.grid}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <FiCpu className={styles.cardIcon} />
            <h2>AI Tax Advisor &amp; Optimizer Settings</h2>
          </div>
          <p className={styles.cardDesc}>
            Control the Gemini AI engine that powers automated income tax optimization reports,
            regime comparison advice, and customized savings strategies.
          </p>
        </div>
        <form onSubmit={onSubmit} className={styles.cardBody}>
          <div className={styles.formGroup}>
            <label className={`${styles.label} ${styles.aiCheckboxLabel}`}>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => onAiEnabledChange(e.target.checked)}
                className={styles.aiCheckbox}
              />
              <span className={styles.aiCheckboxText}>
                Enable AI Tax Advisor for Users
              </span>
            </label>
            <p className={styles.hint}>
              When enabled, users on the Income Tax Calculator page can request a personalized AI Tax Optimization Report.
            </p>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>AI Provider</label>
              <select
                value={aiProvider}
                onChange={(e) => onAiProviderChange(e.target.value)}
                className={styles.select}
              >
                <option value="gemini">Google Gemini</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Model Selection</label>
              <select
                value={aiModel}
                onChange={(e) => onAiModelChange(e.target.value)}
                className={styles.select}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fast &amp; High Precision)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Gemini API Key
              {aiHasKey && (
                <span className={styles.configuredKeyBadge}>
                  (Key is configured)
                </span>
              )}
            </label>
            <input
              type="password"
              value={aiApiKey}
              onChange={(e) => onAiApiKeyChange(e.target.value)}
              placeholder={aiHasKey ? 'Leave blank to keep existing key, or paste new key' : 'Paste Google Gemini API Key (starts with AIza...)'}
              className={styles.input}
            />
            <p className={styles.hint}>
              If left empty, the server will fallback to <code>GEMINI_API_KEY</code> or <code>GOOGLE_API_KEY</code> environment variable if set.
            </p>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tax Advisor System Instructions &amp; Prompt</label>
            <textarea
              rows={5}
              value={aiSystemPrompt}
              onChange={(e) => onAiSystemPromptChange(e.target.value)}
              className={styles.textarea}
              placeholder="System instructions given to the AI tax advisor..."
            />
            <p className={styles.hint}>
              Directives for the AI advisor (e.g. Indian tax nuances, tone of response, budget regulations).
            </p>
          </div>
          <div className={styles.cardActions}>
            <button
              type="submit"
              disabled={busy === 'saving_ai_settings'}
              className={styles.btnPrimary}
            >
              {busy === 'saving_ai_settings' ? 'Saving...' : 'Save AI Settings'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
);
AdminAiTab.displayName = 'AdminAiTab';
