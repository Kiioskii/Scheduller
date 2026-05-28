import { useQuery } from '@tanstack/react-query';
import { fetchScheduleEntries, scheduleKeys } from '../api/schedule.api';

export function useSchedule() {
  return useQuery({
    queryKey: scheduleKeys.list(),
    queryFn: fetchScheduleEntries,
  });
}
