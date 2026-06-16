import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateShiftTemplateInput, UpdateShiftTemplateInput } from '@scheduler/shared';

import {
  createShiftTemplate,
  deleteShiftTemplate,
  fetchShiftTemplates,
  shiftTemplateKeys,
  updateShiftTemplate,
} from '../api/shift-template.api';

export function useShiftTemplates() {
  return useQuery({
    queryKey: shiftTemplateKeys.list(),
    queryFn: fetchShiftTemplates,
  });
}

export function useShiftTemplateMutations() {
  const queryClient = useQueryClient();

  function invalidateShiftTemplates() {
    return queryClient.invalidateQueries({ queryKey: shiftTemplateKeys.list() });
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateShiftTemplateInput) => createShiftTemplate(input),
    onSuccess: invalidateShiftTemplates,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & UpdateShiftTemplateInput) =>
      updateShiftTemplate(id, patch),
    onSuccess: invalidateShiftTemplates,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteShiftTemplate(id),
    onSuccess: invalidateShiftTemplates,
  });

  return {
    createShiftTemplate: createMutation,
    updateShiftTemplate: updateMutation,
    deleteShiftTemplate: deleteMutation,
    isUpdating: updateMutation.isPending,
  };
}
