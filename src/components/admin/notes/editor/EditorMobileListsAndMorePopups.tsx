import React from 'react';
import { FiLink, FiCode, FiCheck, FiCopy } from 'react-icons/fi';
import {
  BsListUl, BsListOl, BsTextIndentRight, BsTextIndentLeft,
  BsTable, BsQuote, BsCheck2All,
} from 'react-icons/bs';
import { MobileButton } from './MobileButton';
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
          <MobileButton action={() => { onInsertList('ul'); onClose(); }} className={styles.dropdownItem}>
            <BsListUl size={14} /> Bulleted List
          </MobileButton>
        </li>
        <li>
          <MobileButton action={() => { onInsertList('ol'); onClose(); }} className={styles.dropdownItem}>
            <BsListOl size={14} /> Numbered List
          </MobileButton>
        </li>
        <li className={styles.dropdownDivider} />
        <li>
          <MobileButton action={() => { onIndent(); onClose(); }} className={styles.dropdownItem}>
            <BsTextIndentRight size={14} /> Indent
          </MobileButton>
        </li>
        <li>
          <MobileButton action={() => { onOutdent(); onClose(); }} className={styles.dropdownItem}>
            <BsTextIndentLeft size={14} /> Outdent
          </MobileButton>
        </li>
      </ul>
    );
  }
  if (activeMobileMenu === 'more') {
    return (
      <ul className={`${styles.mobilePopup} ${styles.alignRight}`}>
        <li>
          <MobileButton action={() => { onClose(); onInsertTable(); }} className={styles.dropdownItem}>
            <BsTable size={14} /> Insert Table
          </MobileButton>
        </li>
        <li>
          <MobileButton action={() => { onClose(); onInsertLink(); }} className={styles.dropdownItem}>
            <FiLink size={14} /> Insert Link
          </MobileButton>
        </li>
        <li>
          <MobileButton action={() => { onExecCmd('formatBlock', '<blockquote>'); onClose(); }} className={styles.dropdownItem}>
            <BsQuote size={14} /> Quote
          </MobileButton>
        </li>
        <li>
          <MobileButton action={() => { onExecCmd('formatBlock', '<pre>'); onClose(); }} className={styles.dropdownItem}>
            <FiCode size={14} /> Code Block
          </MobileButton>
        </li>
        <li className={styles.dropdownDivider} />
        <li>
          <MobileButton action={() => { onClose(); onSelectAll(); }} className={styles.dropdownItem}>
            <BsCheck2All size={14} /> Select All
          </MobileButton>
        </li>
        <li>
          <MobileButton action={() => { void onCopySelection(); onClose(); }} className={styles.dropdownItem}>
            {copySuccess ? <FiCheck size={14} color="var(--color-success)" /> : <FiCopy size={14} />}
            {copySuccess ? 'Copied!' : 'Copy'}
          </MobileButton>
        </li>
      </ul>
    );
  }
  return null;
};
