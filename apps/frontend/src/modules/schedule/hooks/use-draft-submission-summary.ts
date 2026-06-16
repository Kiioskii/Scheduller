import { useQuery } from '@tanstack/react-query';

import type { ScheduleMonth } from '../lib/schedule-month';
import { fetchDraftSubmissionSummary, scheduleKeys } from '../api/schedule.api';

export function useDraftSubmissionSummary(month: ScheduleMonth) {
  return useQuery({
    queryKey: scheduleKeys.draftSubmissionSummary(month.year, month.month),
    queryFn: () => fetchDraftSubmissionSummary(month.year, month.month),
  });
}
