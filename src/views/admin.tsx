'use client';
import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import type { TabType, AlertMessage } from '../components/admin/dashboard/types';
import { AdminHeader } from '../components/admin/dashboard/AdminHeader';
import { AdminPaymentsTab } from '../components/admin/dashboard/AdminPaymentsTab';
import { AdminSubmissionsTab } from '../components/admin/dashboard/AdminSubmissionsTab';
import { AdminUsersTab } from '../components/admin/dashboard/AdminUsersTab';
import { AdminSyncTab } from '../components/admin/dashboard/AdminSyncTab';
import { AdminAiTab } from '../components/admin/dashboard/AdminAiTab';
import { useAdminPayments } from '../components/admin/dashboard/useAdminPayments';
import { useAdminUsers } from '../components/admin/dashboard/useAdminUsers';
import { useAdminAiSync } from '../components/admin/dashboard/useAdminAiSync';
import styles from './Admin.module.scss';
const Admin: React.FC = () => {
  const { token: authToken, user } = useAuth();
  const [token, setToken] = useState(() => authToken || '');
  const [activeTab, setActiveTab] = useState<TabType>('payments');
  const [message, setMessage] = useState<AlertMessage | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const effectiveToken = token || authToken || '';
  const users = useAdminUsers(effectiveToken, setBusy, setMessage);
  const payments = useAdminPayments(effectiveToken, setBusy, setMessage, users.fetchUsers);
  const aiSync = useAdminAiSync(effectiveToken, setBusy, setMessage);
  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'submissions') void payments.fetchSubmissions();
    if (tab === 'users') void users.fetchUsers();
    if (tab === 'ai') void aiSync.fetchAiSettings();
  };
  return (
    <main className={styles.container}>
      <AdminHeader
        userEmail={user?.email}
        activeTab={activeTab}
        pendingCount={payments.submissions.filter((s) => s.status === 'pending').length}
        usersCount={users.usersList.length}
        onSelectTab={handleSelectTab}
      />
      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          <span>{message.text}</span>
        </div>
      )}
      {activeTab === 'payments' && (
        <AdminPaymentsTab
          payTitle={payments.payTitle}
          payUpiId={payments.payUpiId}
          payAmount={payments.payAmount}
          payQrUrl={payments.payQrUrl}
          payInstructions={payments.payInstructions}
          busy={busy}
          onTitleChange={payments.setPayTitle}
          onUpiIdChange={payments.setPayUpiId}
          onAmountChange={payments.setPayAmount}
          onQrUrlChange={payments.setPayQrUrl}
          onInstructionsChange={payments.setPayInstructions}
          onQrFileUpload={payments.handleQrFileUpload}
          onSubmit={payments.handleSavePaymentSettings}
        />
      )}
      {activeTab === 'submissions' && (
        <AdminSubmissionsTab
          submissions={payments.submissions}
          busy={busy}
          onRefresh={payments.fetchSubmissions}
          onProcessPayment={payments.handleProcessPayment}
        />
      )}
      {activeTab === 'users' && (
        <AdminUsersTab
          usersList={users.usersList}
          now={users.now}
          busy={busy}
          limitModalUser={users.limitModalUser}
          customLimitInput={users.customLimitInput}
          onRefresh={users.fetchUsers}
          onOpenLimitModal={users.setLimitModalUser}
          onCloseLimitModal={() => users.setLimitModalUser(null)}
          onCustomLimitChange={users.setCustomLimitInput}
          onUserAction={users.handleUserAction}
        />
      )}
      {activeTab === 'sync' && (
        <AdminSyncTab
          token={token}
          imfJson={aiSync.imfJson}
          pppJson={aiSync.pppJson}
          navSchemeCodes={aiSync.navSchemeCodes}
          navReport={aiSync.navReport}
          busy={busy}
          onTokenChange={setToken}
          onImfJsonChange={aiSync.setImfJson}
          onPppJsonChange={aiSync.setPppJson}
          onNavSchemeCodesChange={aiSync.setNavSchemeCodes}
          onSync={aiSync.sync}
          onErrorMessage={(txt) => setMessage({ type: 'error', text: txt })}
        />
      )}
      {activeTab === 'ai' && (
        <AdminAiTab
          aiEnabled={aiSync.aiEnabled}
          aiProvider={aiSync.aiProvider}
          aiModel={aiSync.aiModel}
          aiApiKey={aiSync.aiApiKey}
          aiHasKey={aiSync.aiHasKey}
          aiSystemPrompt={aiSync.aiSystemPrompt}
          busy={busy}
          onAiEnabledChange={aiSync.setAiEnabled}
          onAiProviderChange={aiSync.setAiProvider}
          onAiModelChange={aiSync.setAiModel}
          onAiApiKeyChange={aiSync.setAiApiKey}
          onAiSystemPromptChange={aiSync.setAiSystemPrompt}
          onSubmit={aiSync.handleSaveAiSettings}
        />
      )}
    </main>
  );
};
export default Admin;
