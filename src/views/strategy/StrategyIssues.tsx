'use client';
import React from 'react';
import { FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import type { ValidationIssue } from './validation';
import styles from './StrategyCalculator.module.scss';
interface StrategyIssuesProps {
  issues: ValidationIssue[];
  /** Engine-reported problems, such as a withdrawal the holding could not fund. */
  warnings: string[];
  navError: string | null;
}
/**
 * Configuration errors, engine warnings and NAV-loading failures, all labelled
 * by text and icon rather than by colour alone.
 */
export const StrategyIssues = ({ issues, warnings, navError }: StrategyIssuesProps) => {
  const rows: ValidationIssue[] = [
    ...(navError ? [{ id: 'nav', message: navError, severity: 'error' as const }] : []),
    ...issues,
    ...warnings.map((message, index) => ({
      id: `engine-${index}`,
      message,
      severity: 'warning' as const,
    })),
  ];
  if (rows.length === 0) return null;
  return (
    <ul className={styles.issueList} aria-live="polite" aria-label="Configuration messages">
      {rows.map((row) => {
        const isError = row.severity === 'error';
        const Icon = isError ? FiAlertCircle : FiAlertTriangle;
        return (
          <li
            key={row.id}
            className={`${styles.issue} ${isError ? styles.issueError : styles.issueWarning}`}
          >
            <Icon className={styles.issueIcon} aria-hidden="true" />
            <span>
              <strong>{isError ? 'Error: ' : 'Warning: '}</strong>
              {row.message}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
