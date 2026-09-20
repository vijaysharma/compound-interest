import React from 'react';
import { FiMoreHorizontal } from 'react-icons/fi';
import { BsListUl } from 'react-icons/bs';
import { MobileMenuType } from './types';
import { EditorMobileListsAndMorePopups } from './EditorMobileListsAndMorePopups';
import styles from '../NotesEditor.module.scss';
interface EditorMobileExtraToolsProps {
  activeMobileMenu: MobileMenuType;
  setActiveMobileMenu: (menu: MobileMenuType) => void;
  copySuccess: boolean;
  onInsertList: (type: 'ul' | 'ol') => void;
  onIndent: () => void;
  onOutdent: () => void;
  onInsertTable: () => void;
  onInsertLink: () => void;
  onExecCmd: (cmd: string, val?: string) => void;
  onSelectAll: () => void;
  onCopySelection: () => void;
}
export const EditorMobileExtraTools: React.FC<EditorMobileExtraToolsProps> = ({
  activeMobileMenu,
  setActiveMobileMenu,
  copySuccess,
  onInsertList,
  onIndent,
  onOutdent,
  onInsertTable,
  onInsertLink,
  onExecCmd,
  onSelectAll,
  onCopySelection,
}) => {
  return (
    <>
      <div className={styles.relativeBox}>
        <button
          type="button"
          onClick={() => setActiveMobileMenu(activeMobileMenu === 'lists' ? null : 'lists')}
          className={`${styles.mobileBarBtn} ${activeMobileMenu === 'lists' ? styles.active : ''}`}
          title="Lists & Indentation"
        >
          <BsListUl size={16} />
        </button>
        {activeMobileMenu === 'lists' && (
          <EditorMobileListsAndMorePopups
            activeMobileMenu="lists"
            copySuccess={copySuccess}
            onInsertList={onInsertList}
            onIndent={onIndent}
            onOutdent={onOutdent}
            onInsertTable={onInsertTable}
            onInsertLink={onInsertLink}
            onExecCmd={onExecCmd}
            onSelectAll={onSelectAll}
            onCopySelection={onCopySelection}
            onClose={() => setActiveMobileMenu(null)}
          />
        )}
      </div>
      <div className={styles.relativeBox}>
        <button
          type="button"
          onClick={() => setActiveMobileMenu(activeMobileMenu === 'more' ? null : 'more')}
          className={`${styles.mobileBarBtn} ${activeMobileMenu === 'more' ? styles.active : ''}`}
          title="More Tools"
        >
          <FiMoreHorizontal size={16} />
        </button>
        {activeMobileMenu === 'more' && (
          <EditorMobileListsAndMorePopups
            activeMobileMenu="more"
            copySuccess={copySuccess}
            onInsertList={onInsertList}
            onIndent={onIndent}
            onOutdent={onOutdent}
            onInsertTable={onInsertTable}
            onInsertLink={onInsertLink}
            onExecCmd={onExecCmd}
            onSelectAll={onSelectAll}
            onCopySelection={onCopySelection}
            onClose={() => setActiveMobileMenu(null)}
          />
        )}
      </div>
    </>
  );
};
