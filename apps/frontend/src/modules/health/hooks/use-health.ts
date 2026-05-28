import { useQuery } from '@tanstack/react-query';
import { fetchHealth, healthKeys } from '../api/health.api';

export function useHealth() {
  return useQuery({
    queryKey: healthKeys.all,
    queryFn: fetchHealth,
  });
}
