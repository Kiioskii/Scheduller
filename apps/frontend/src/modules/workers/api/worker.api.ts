import {
  createWorkerInputSchema,
  workerPrioritySchema,
  workerSchema,
  type CreateWorkerInput,
  type Worker,
} from '@scheduler/shared';

export type { Worker, CreateWorkerInput };

export const workerKeys = {
  all: ['workers'] as const,
  list: () => [...workerKeys.all, 'list'] as const,
};

const initialWorkers: Worker[] = workerSchema.array().parse([
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    firstName: 'Anna',
    lastName: 'Kowalska',
    priority: 8,
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    firstName: 'Piotr',
    lastName: 'Nowak',
    priority: 5,
  },
]);

/** Tymczasowy store w pamięci — zamień na fetch z API / Supabase */
let workersStore: Worker[] = [...initialWorkers];

function delay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWorkers(): Promise<Worker[]> {
  await delay();
  return workerSchema.array().parse([...workersStore]);
}

export async function createWorker(input: CreateWorkerInput): Promise<Worker> {
  const [worker] = await createWorkers([input]);
  return worker;
}

export async function createWorkers(inputs: CreateWorkerInput[]): Promise<Worker[]> {
  await delay();
  if (inputs.length === 0) return [];

  const created = inputs.map((input) => {
    const data = createWorkerInputSchema.parse(input);
    return workerSchema.parse({
      id: crypto.randomUUID(),
      ...data,
    });
  });
  workersStore = [...workersStore, ...created];
  return created;
}

export async function updateWorkerPriority(id: string, priority: number): Promise<Worker> {
  await delay();
  const parsedPriority = workerPrioritySchema.parse(priority);
  const index = workersStore.findIndex((w) => w.id === id);
  if (index === -1) throw new Error('Pracownik nie został znaleziony');

  const updated = workerSchema.parse({ ...workersStore[index], priority: parsedPriority });
  workersStore = workersStore.map((w) => (w.id === id ? updated : w));
  return updated;
}

export async function deleteWorker(id: string): Promise<void> {
  await delay();
  const exists = workersStore.some((w) => w.id === id);
  if (!exists) throw new Error('Pracownik nie został znaleziony');
  workersStore = workersStore.filter((w) => w.id !== id);
}
