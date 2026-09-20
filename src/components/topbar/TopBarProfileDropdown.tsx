import React, { RefObject } from 'react';
import { FiAward, FiLogOut, FiShield, FiZap } from 'react-icons/fi';
import type { AuthUser } from '../../types/auth';
import styles from '../TopBar.module.scss';
interface TopBarProfileDropdownProps {
  user: AuthUser;
  isAdmin: boolean;
  isProfileOpen: boolean;
  setIsProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  profileRef: RefObject<HTMLDivElement | null>;
  setShowPaywall: (show: boolean) => void;
  onLogout: () => Promise<void>;
}
export function TopBarProfileDropdown({
  user,
  isAdmin,
  isProfileOpen,
  setIsProfileOpen,
  profileRef,
  setShowPaywall,
  onLogout,
}: TopBarProfileDropdownProps) {
  return (
    <div className={styles.userContainer} ref={profileRef}>
      {isAdmin ? (
        <span className={styles.badgeAdmin}>
          <FiShield className={styles.badgeIcon} />
          Admin
        </span>
      ) : user.subscription_status === 'active' ? (
        <span className={styles.badgePro}>
          <FiAward className={styles.badgeIcon} />
          Pro Active
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setShowPaywall(true)}
          className={`${styles.paywallBtn} ${user.isBlocked ? styles.warningPulse : ''}`.trim()}
          title={`${user.api_usage_count ?? 0}/${user.freeLimit ?? 15} live calculations used in 48h trial. Other calculators are free for 48 hours.`}
        >
          <FiZap className={styles.badgeIcon} />
          <span>
            {user.api_usage_count ?? 0}/{user.freeLimit ?? 15} Live
          </span>
          <span className={styles.proPrice}>₹54 Pro</span>
        </button>
      )}
      <button
        type="button"
        className={styles.profileTriggerBtn}
        onClick={() => setIsProfileOpen((prev) => !prev)}
        aria-expanded={isProfileOpen}
        aria-haspopup="true"
        title="Account profile & options"
      >
        <div className={styles.userEmailCol}>
          <span className={styles.userNameText}>{user.name || user.email}</span>
        </div>
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name || user.email}
            className={styles.userAvatar}
          />
        ) : (
          <div className={styles.userInitial}>{(user.name || user.email).charAt(0)}</div>
        )}
      </button>
      {isProfileOpen && (
        <div className={styles.profileDropdown} role="menu">
          <div className={styles.profileDropdownHeader}>
            <div className={styles.profileDropdownInfo}>
              <span className={styles.profileDropdownName}>{user.name || 'User'}</span>
              <span className={styles.profileDropdownEmail}>{user.email}</span>
            </div>
            {isAdmin ? (
              <span className={styles.badgeAdminInline}>Admin</span>
            ) : user.subscription_status === 'active' ? (
              <span className={styles.badgeProInline}>Pro Active</span>
            ) : (
              <span className={styles.badgeFreeInline}>Trial Account</span>
            )}
          </div>
          <div className={styles.profileDropdownDivider} />
          {user.subscription_status !== 'active' && !isAdmin && (
            <button
              type="button"
              className={styles.profileDropdownItem}
              onClick={() => {
                setIsProfileOpen(false);
                setShowPaywall(true);
              }}
            >
              <FiZap className={styles.profileDropdownIcon} />
              <span>Upgrade to Pro (₹54/mo)</span>
            </button>
          )}
          <button
            type="button"
            className={`${styles.profileDropdownItem} ${styles.profileDropdownLogout}`}
            onClick={() => {
              setIsProfileOpen(false);
              void onLogout();
            }}
          >
            <FiLogOut className={styles.profileDropdownIcon} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
