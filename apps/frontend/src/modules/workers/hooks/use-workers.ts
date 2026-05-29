import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateWorkerInput, UpdateWorkerInput } from '@scheduler/shared';

import {
  createWorker,
  createWorkers,
  deleteWorker,
  fetchWorkers,
  restoreWorker,
  updateWorker,
  updateWorkerPriority,
  workerKeys,
} from '../api/worker.api';

export function useWorkers() {
  return useQuery({
    queryKey: workerKeys.list(),
    queryFn: fetchWorkers,
  });
}

export function useWorkerMutations() {
  const queryClient = useQueryClient();

  function invalidateWorkers() {
    return queryClient.invalidateQueries({ queryKey: workerKeys.list() });
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateWorkerInput) => createWorker(input),
    onSuccess: invalidateWorkers,
  });

  const createBulkMutation = useMutation({
    mutationFn: (inputs: CreateWorkerInput[]) => createWorkers(inputs),
    onSuccess: invalidateWorkers,
  });

  const updateWorkerMutation = useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & UpdateWorkerInput) => updateWorker(id, patch),
    onSuccess: invalidateWorkers,
  });

  const updatePriorityMutation = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: number }) =>
      updateWorkerPriority(id, priority),
    onSuccess: invalidateWorkers,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorker(id),
    onSuccess: invalidateWorkers,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreWorker(id),
    onSuccess: invalidateWorkers,
  });

  const isUpdating = updateWorkerMutation.isPending || updatePriorityMutation.isPending;

  return {
    createWorker: createMutation,
    createWorkersBulk: createBulkMutation,
    updateWorker: updateWorkerMutation,
    updatePriority: updatePriorityMutation,
    deleteWorker: deleteMutation,
    restoreWorker: restoreMutation,
    isUpdating,
  };
}
