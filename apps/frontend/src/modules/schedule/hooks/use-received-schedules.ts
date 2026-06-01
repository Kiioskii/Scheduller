import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchReceivedSchedules, scheduleKeys, submitWorkerDraft } from '../api/schedule.api';
import type { ScheduleMonth } from '../lib/schedule-month';

export function useReceivedSchedules(month: ScheduleMonth) {
  return useQuery({
    queryKey: scheduleKeys.received(month.year, month.month),
    queryFn: () => fetchReceivedSchedules(month.year, month.month),
  });
}

export function useSubmitWorkerDraft(month: ScheduleMonth) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workerId, file }: { workerId: string; file: File }) =>
      submitWorkerDraft({
        workerId,
        year: month.year,
        month: month.month,
        file,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: scheduleKeys.received(month.year, month.month),
      });
    },
  });
}
