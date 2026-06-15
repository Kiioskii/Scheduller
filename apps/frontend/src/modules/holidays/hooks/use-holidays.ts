import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateHolidayInput, UpdateHolidayInput } from '@scheduler/shared';

import {
  createHolidays,
  deleteHoliday,
  fetchHolidays,
  holidayKeys,
  updateHoliday,
} from '../api/holiday.api';

export function useHolidays(year: number) {
  return useQuery({
    queryKey: holidayKeys.list(year),
    queryFn: () => fetchHolidays(year),
  });
}

export function useHolidayMutations(year: number) {
  const queryClient = useQueryClient();

  function invalidateHolidays() {
    return queryClient.invalidateQueries({ queryKey: holidayKeys.list(year) });
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateHolidayInput) => createHolidays(input),
    onSuccess: invalidateHolidays,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & UpdateHolidayInput) => updateHoliday(id, patch),
    onSuccess: invalidateHolidays,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: invalidateHolidays,
  });

  return {
    createHolidays: createMutation,
    updateHoliday: updateMutation,
    deleteHoliday: deleteMutation,
    isUpdating: updateMutation.isPending,
  };
}
