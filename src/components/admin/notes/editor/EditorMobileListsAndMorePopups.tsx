import React from 'react';
import { FiLink, FiCode, FiCheck, FiCopy } from 'react-icons/fi';
import {
  BsListUl, BsListOl, BsTextIndentRight, BsTextIndentLeft,
  BsTable, BsQuote, BsCheck2All,
} from 'react-icons/bs';
import styles from '../NotesEditor.module.scss';
import { MobileMenuType } from './types';
interface EditorMobileListsAndMorePopupsProps {
  activeMobileMenu: MobileMenuType;
  copySuccess: boolean;
  onInsertList: (type: 'ul' | 'ol') => void;
  onIndent: () => void;
  onOutdent: () => void;
  onInsertTable: () => void;
  onInsertLink: () => void;
  onExecCmd: (cmd: string, val?: string) => void;
  onSelectAll: () => void;
  onCopySelection: () => void;
  onClose: () => void;
}
export const EditorMobileListsAndMorePopups: React.FC<EditorMobileListsAndMorePopupsProps> = ({
  activeMobileMenu,
  copySuccess,
  onInsertList,
  onIndent,
  onOutdent,
  onInsertTable,
  onInsertLink,
  onExecCmd,
  onSelectAll,
  onCopySelection,
  onClose,
}) => {
  if (activeMobileMenu === 'lists') {
    return (
      <ul className={`${styles.mobilePopup} ${styles.alignLeft}`}>
        <li>
          <button type="button" onClick={() => { onInsertList('ul'); onClose(); }} className={styles.dropdownItem}>
            <BsListUl size={14} /> Bulleted List
          </button>
        </li>
        <li>
          <button type="button" onClick={() => { onInsertList('ol'); onClose(); }} className={styles.dropdownItem}>
            <BsListOl size={14} /> Numbered List
          </button>
        </li>
        <li className={styles.dropdownDivider} />
        <li>
          <button type="button" onClick={() => { onIndent(); onClose(); }} className={styles.dropdownItem}>
            <BsTextIndentRight size={14} /> Indent
          </button>
        </li>
        <li>
          <button type="button" onClick={() => { onOutdent(); onClose(); }} className={styles.dropdownItem}>
            <BsTextIndentLeft size={14} /> Outdent
          </button>
        </li>
      </ul>
    );
  }
  if (activeMobileMenu === 'more') {
    return (
      <ul className={`${styles.mobilePopup} ${styles.alignRight}`}>
        <li>
          <button type="button" onClick={() => { onClose(); onInsertTable(); }} className={styles.dropdownItem}>
            <BsTable size={14} /> Insert Table
          </button>
        </li>
        <li>
          <button type="button" onClick={() => { onClose(); onInsertLink(); }} className={styles.dropdownItem}>
            <FiLink size={14} /> Insert Link
          </button>
        </li>
        <li>
          <button type="button" onClick={() => { onExecCmd('formatBlock', '<blockquote>'); onClose(); }} className={styles.dropdownItem}>
            <BsQuote size={14} /> Quote
          </button>
        </li>
        <li>
          <button type="button" onClick={() => { onExecCmd('formatBlock', '<pre>'); onClose(); }} className={styles.dropdownItem}>
            <FiCode size={14} /> Code Block
          </button>
        </li>
        <li className={styles.dropdownDivider} />
        <li>
          <button type="button" onClick={() => { onClose(); onSelectAll(); }} className={styles.dropdownItem}>
            <BsCheck2All size={14} /> Select All
          </button>
        </li>
        <li>
          <button type="button" onClick={() => { void onCopySelection(); onClose(); }} className={styles.dropdownItem}>
            {copySuccess ? <FiCheck size={14} color="var(--color-success)" /> : <FiCopy size={14} />}
            {copySuccess ? 'Copied!' : 'Copy'}
          </button>
        </li>
      </ul>
    );
  }
  return null;
};
