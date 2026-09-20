'use client';
import React from 'react';
import { FiRotateCcw } from 'react-icons/fi';
import { NotesEditorProps } from './editor/types';
import { useNotesEditorState } from './editor/useNotesEditorState';
import { applyContainerViewportStyles } from './editor/viewportStyleUtils';
import { EditorEmptyScreen } from './editor/EditorEmptyScreen';
import { EditorLockedScreen } from './editor/EditorLockedScreen';
import { EditorTopBar } from './editor/EditorTopBar';
import { EditorToolbarDesktop } from './editor/EditorToolbarDesktop';
import { EditorToolbarMobile } from './editor/EditorToolbarMobile';
import { EditorTableTools } from './editor/EditorTableTools';
import { EditorCanvas } from './editor/EditorCanvas';
import { EditorModals } from './editor/EditorModals';
import styles from './NotesEditor.module.scss';
export const NotesEditor: React.FC<NotesEditorProps> = (props) => {
  const {
    note, folders, isSaving, onUpdateNote, onTogglePin, onDeleteNote, onRestoreNote,
    onPermanentDelete, onNewNote, onOpenLockModal, onDuplicateNote, isUnlockedInSession,
    onUnlockSession, onToggleSidebar, isSidebarOpen, onBackMobile, onOpenBackupModal,
    onOpenSecurityModal, onCreateFolder, folderTitle, isMobileScreen,
  } = props;
  const state = useNotesEditorState(props);
  if (!note) {
    return (
      <EditorEmptyScreen
        isMobileScreen={isMobileScreen} onBackMobile={onBackMobile}
        onToggleSidebar={onToggleSidebar} isSidebarOpen={isSidebarOpen}
        onNewNote={onNewNote} onOpenSecurityModal={onOpenSecurityModal}
      />
    );
  }
  if (note.is_locked && !isUnlockedInSession) {
    return (
      <EditorLockedScreen
        note={note} folderTitle={folderTitle} onBackMobile={onBackMobile}
        onUnlockSession={onUnlockSession} onDeleteRequest={() => state.setShowDeleteConfirm(true)}
      />
    );
  }
  const isTrash = Boolean(note.is_trashed);
  const { viewportState, activeMobileMenu, setActiveMobileMenu, activeDropdown, setActiveDropdown } = state.viewport;
  return (
    <div
      className={`${styles.container} qn-paper`}
      ref={(el) => applyContainerViewportStyles(el, isMobileScreen, viewportState)}
    >
      <EditorTopBar
        note={note} isTrash={isTrash} folders={folders} folderTitle={folderTitle}
        isMobileScreen={isMobileScreen} isSidebarOpen={isSidebarOpen}
        onBackMobile={onBackMobile} onToggleSidebar={onToggleSidebar}
        onTogglePin={onTogglePin} onOpenLockModal={onOpenLockModal}
        onRestoreNote={onRestoreNote} onDeleteRequest={() => state.setShowDeleteConfirm(true)}
        onUpdateNote={onUpdateNote} onOpenMoveModal={() => state.setShowMoveModal(true)}
        onOpenBackupModal={onOpenBackupModal} onDuplicateNote={onDuplicateNote}
        activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown}
        setActiveMobileMenu={setActiveMobileMenu} onDumpToGoogleDrive={state.exportOps.handleDumpToGoogleDrive}
        onDumpToOneDrive={state.exportOps.handleDumpToOneDrive} onCopy={state.exportOps.handleCopy}
        onExportMarkdown={state.exportOps.handleExportMarkdown} onExportText={state.exportOps.handleExportText}
        onPrint={state.exportOps.handlePrint} copySuccess={state.exportOps.copySuccess}
      />
      {!isTrash && (
        <EditorToolbarDesktop
          currentFontSize={state.content.currentFontSize} activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown} onUndo={state.history.handleUndo}
          onRedo={state.history.handleRedo} onExecCmd={state.formatting.execCmd}
          onApplyFontSize={state.formatting.applyFontSize} onApplyTextColor={state.formatting.applyTextColor}
          onApplyHighlightColor={state.formatting.applyHighlightColor}
          onApplyHighlighter={state.formatting.applyHighlighter}
          onInsertChecklistItem={state.checklist.insertChecklistItem}
          onInsertList={state.listAndTable.handleInsertList} onIndent={state.formatting.handleIndent}
          onOutdent={state.formatting.handleOutdent} onInsertTable={state.listAndTable.insertTable}
          onInsertLink={state.formatting.insertLink} onSelectAll={state.selection.handleSelectAll}
          onCopySelection={state.exportOps.handleCopySelection} copySuccess={state.exportOps.copySuccess}
        />
      )}
      {isTrash && (
        <div className={styles.trashBanner}>
          <span>This note is in Recently Deleted. You cannot edit it unless you restore it.</span>
          <button onClick={onRestoreNote} className={`${styles.btnPrimary} ${styles.restoreBtnSm}`}>
            <FiRotateCcw size={12} className={styles.iconMr025} />
            Restore Note
          </button>
        </div>
      )}
      <EditorTableTools
        activeTable={state.listAndTable.activeTable} isTrash={isTrash}
        onAddRow={state.listAndTable.addTableRow} onAddColumn={state.listAndTable.addTableColumn}
        onDeleteTable={state.listAndTable.deleteTable} onClose={() => state.listAndTable.setActiveTable(null)}
      />
      <EditorCanvas
        note={note} isTrash={isTrash} isSaving={isSaving} wordCount={state.content.wordCount}
        charCount={state.content.charCount} canvasContainerRef={state.canvasContainerRef}
        editorRef={state.editorRef} titleInputRef={state.titleInputRef}
        newTagInput={state.tags.newTagInput} setNewTagInput={state.tags.setNewTagInput}
        isAddingTag={state.tags.isAddingTag} setIsAddingTag={state.tags.setIsAddingTag}
        onCloseMenus={() => {
          if (activeMobileMenu) setActiveMobileMenu(null);
          if (activeDropdown) setActiveDropdown(null);
        }}
        onTitleChange={state.tags.handleTitleChange} onAddTag={state.tags.handleAddTag}
        onRemoveTag={state.tags.handleRemoveTag} onOpenSecurityModal={onOpenSecurityModal}
        onPaste={state.content.handlePaste} onInput={() => state.content.handleContentChange()}
        onClick={state.checklist.handleEditorClick} onKeyDown={state.keyboard.handleKeyDown}
        onSaveSelection={state.selection.saveSelection}
      />
      {(activeMobileMenu || (isMobileScreen && activeDropdown)) && (
        <div className={styles.mobileBackdrop} onClick={() => { setActiveMobileMenu(null); setActiveDropdown(null); }} />
      )}
      {!isTrash && (
        <EditorToolbarMobile
          editorRef={state.editorRef} currentFontSize={state.content.currentFontSize}
          viewportState={viewportState} activeMobileMenu={activeMobileMenu}
          setActiveMobileMenu={setActiveMobileMenu} copySuccess={state.exportOps.copySuccess}
          onUndo={state.history.handleUndo} onRedo={state.history.handleRedo}
          onExecCmd={state.formatting.execCmd} onApplyFontSize={state.formatting.applyFontSize}
          onApplyTextColor={state.formatting.applyTextColor}
          onApplyHighlightColor={state.formatting.applyHighlightColor}
          onInsertChecklistItem={state.checklist.insertChecklistItem}
          onInsertList={state.listAndTable.handleInsertList} onIndent={state.formatting.handleIndent}
          onOutdent={state.formatting.handleOutdent} onInsertTable={state.listAndTable.insertTable}
          onInsertLink={state.formatting.insertLink} onSelectAll={state.selection.handleSelectAll}
          onCopySelection={state.exportOps.handleCopySelection} onBackMobile={onBackMobile}
        />
      )}
      <EditorModals
        note={note} folders={folders} isTrash={isTrash}
        showDeleteConfirm={state.showDeleteConfirm} showMoveModal={state.showMoveModal}
        onCloseDeleteConfirm={() => state.setShowDeleteConfirm(false)}
        onCloseMoveModal={() => state.setShowMoveModal(false)}
        onPermanentDelete={onPermanentDelete} onDeleteNote={onDeleteNote}
        onUpdateNote={onUpdateNote} onCreateFolder={onCreateFolder}
      />
    </div>
  );
};
