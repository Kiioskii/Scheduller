import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImportedScheduleFile } from '@scheduler/shared';

import {
  downloadSchedulePodklad,
  fetchScheduleEntries,
  parseSchedulesImport,
  saveSchedulesImport,
  scheduleKeys,
} from '../api/schedule.api';

export function useSchedule() {
  return useQuery({
    queryKey: scheduleKeys.list(),
    queryFn: fetchScheduleEntries,
  });
}

export function useScheduleMutations() {
  const queryClient = useQueryClient();

  const parseImportMutation = useMutation({
    mutationFn: (files: File[]) => parseSchedulesImport(files),
  });

  const saveImportMutation = useMutation({
    mutationFn: (files: ImportedScheduleFile[]) => saveSchedulesImport(files),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleKeys.imported() });
    },
  });

  const downloadPodkladMutation = useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      downloadSchedulePodklad(year, month),
  });

  return {
    parseSchedulesImport: parseImportMutation,
    saveSchedulesImport: saveImportMutation,
    downloadPodklad: downloadPodkladMutation,
  };
}
