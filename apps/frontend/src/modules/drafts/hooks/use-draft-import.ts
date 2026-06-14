import { useMutation, useQueryClient } from '@tanstack/react-query';

import { workerKeys } from '@/modules/workers/api/worker.api';
import type { ScheduleMonth } from '@/modules/schedule/lib/schedule-month';

import { analyzeDraftImports, confirmDraftImports, draftKeys } from '../api/drafts.api';

export function useDraftImportMutations(month: ScheduleMonth) {
  const queryClient = useQueryClient();

  const invalidateReceived = () => {
    void queryClient.invalidateQueries({
      queryKey: draftKeys.received(month.year, month.month),
    });
    void queryClient.invalidateQueries({ queryKey: workerKeys.list() });
  };

  const analyzeDrafts = useMutation({
    mutationFn: (files: File[]) => analyzeDraftImports(files, month.year, month.month),
  });

  const confirmDrafts = useMutation({
    mutationFn: (params: Parameters<typeof confirmDraftImports>[0]) => confirmDraftImports(params),
    onSuccess: invalidateReceived,
  });

  return { analyzeDrafts, confirmDrafts };
}
