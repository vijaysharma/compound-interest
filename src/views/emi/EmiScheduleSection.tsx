import React from 'react';
import { ScheduleRow } from './types';
import { EmiMobileSchedule } from './EmiMobileSchedule';
import { EmiDesktopSchedule } from './EmiDesktopSchedule';
interface EmiScheduleSectionProps {
  schedule: ScheduleRow[];
}
export const EmiScheduleSection: React.FC<EmiScheduleSectionProps> = ({ schedule }) => {
  if (schedule.length === 0) return null;
  return (
    <>
      <EmiMobileSchedule schedule={schedule} />
      <EmiDesktopSchedule schedule={schedule} />
    </>
  );
};
