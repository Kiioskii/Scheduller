import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ScheduleMonth } from '@/modules/schedule/lib/schedule-month';

import {
  deleteWorkerDraft,
  draftKeys,
  downloadWorkerDraft,
  fetchReceivedDrafts,
  fetchWorkerDraftFiles,
  submitWorkerDraft,
} from '../api/drafts.api';

export function useReceivedDrafts(month: ScheduleMonth) {
  return useQuery({
    queryKey: draftKeys.received(month.year, month.month),
    queryFn: () => fetchReceivedDrafts(month.year, month.month),
  });
}

/** @deprecated use useReceivedDrafts */
export const useReceivedSchedules = useReceivedDrafts;

export function useWorkerDraftFiles(
  month: ScheduleMonth,
  workerId: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: draftKeys.workerFiles(workerId ?? '', month.year, month.month),
    queryFn: () =>
      fetchWorkerDraftFiles({
        workerId: workerId!,
        year: month.year,
        month: month.month,
      }),
    enabled: enabled && Boolean(workerId),
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
        queryKey: draftKeys.received(month.year, month.month),
      });
    },
  });
}

export function useDownloadWorkerDraft(month: ScheduleMonth) {
  return useMutation({
    mutationFn: ({ workerId, draftId }: { workerId: string; draftId?: string }) =>
      downloadWorkerDraft({
        workerId,
        year: month.year,
        month: month.month,
        draftId,
      }),
  });
}

export function useDeleteWorkerDraft(month: ScheduleMonth) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workerId, draftId }: { workerId: string; draftId: string }) =>
      deleteWorkerDraft({
        workerId,
        year: month.year,
        month: month.month,
        draftId,
      }),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: draftKeys.received(month.year, month.month),
      });
      void queryClient.invalidateQueries({
        queryKey: draftKeys.workerFiles(variables.workerId, month.year, month.month),
      });
    },
  });
}
