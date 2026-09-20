'use client';
import React from 'react';
import { FiTruck, FiX, FiExternalLink } from 'react-icons/fi';
import type { ShiprocketTrackingData } from './types';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketTrackingModalProps {
  awb: string;
  trackingData: ShiprocketTrackingData | null;
  loadingTracking: boolean;
  onClose: () => void;
}
export const ShiprocketTrackingModal: React.FC<ShiprocketTrackingModalProps> = React.memo(
  ({ awb, trackingData, loadingTracking, onClose }) => (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <FiTruck /> Tracking AWB: {awb}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className={styles.modalBody}>
          {loadingTracking ? (
            <div className={styles.emptyState}>
              <span className={styles.spinner} />
              <p className={styles.emptyDesc}>Fetching live tracking updates...</p>
            </div>
          ) : trackingData ? (
            <>
              <div className={styles.trackingMetaRow}>
                <div>
                  <div className={styles.metaLabel}>
                    Current Status
                  </div>
                  <div className={styles.metaValueLg}>
                    {trackingData.shipment_track?.[0]?.current_status || 'In Transit'}
                  </div>
                </div>
                <div>
                  <div className={styles.metaLabel}>
                    Courier Partner
                  </div>
                  <div className={styles.metaValue}>
                    {trackingData.shipment_track?.[0]?.courier_name || 'Shiprocket Partner'}
                  </div>
                </div>
              </div>
              {trackingData.shipment_track?.[0]?.pod && (
                <div className={styles.podLinkWrapper}>
                  <a
                    href={trackingData.shipment_track[0].pod}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.rechargeLink}
                  >
                    View Proof of Delivery (POD) <FiExternalLink />
                  </a>
                </div>
              )}
              <div className={styles.timeline}>
                {trackingData.shipment_track_activities && trackingData.shipment_track_activities.length > 0 ? (
                  trackingData.shipment_track_activities.map((act, i) => (
                    <div key={i} className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      <div className={styles.timelineTime}>{act.date}</div>
                      <div className={styles.timelineActivity}>{act.activity}</div>
                      {act.location && <div className={styles.timelineLocation}>{act.location}</div>}
                    </div>
                  ))
                ) : (
                  <div className={styles.noEventsText}>
                    No scan events recorded yet for this AWB.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyDesc}>No tracking information found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
);
ShiprocketTrackingModal.displayName = 'ShiprocketTrackingModal';
