import { useMutation } from '@tanstack/react-query';

import { downloadDraftTemplate } from '../api/drafts.api';

export function useDraftMutations() {
  const downloadPodklad = useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      downloadDraftTemplate(year, month),
  });

  return { downloadPodklad };
}
