import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useWorkerMutations } from '../hooks/use-workers';

const PRIORITY_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

type AddWorkerFormProps = {
  onClose: () => void;
};

export function AddWorkerForm({ onClose }: AddWorkerFormProps) {
  const { createWorker } = useWorkerMutations();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [priority, setPriority] = useState(5);

  function resetForm() {
    setFirstName('');
    setLastName('');
    setPriority(5);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createWorker.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim(), priority },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      },
    );
  }

  const canSubmit =
    firstName.trim().length > 0 && lastName.trim().length > 0 && !createWorker.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 size-8"
        onClick={onClose}
        aria-label="Zamknij formularz"
      >
        <X className="size-4" />
      </Button>

      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <p className="text-sm font-medium">Nowy pracownik</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="worker-first-name">Imię</Label>
        <Input
          id="worker-first-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Jan"
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="worker-last-name">Nazwisko</Label>
        <Input
          id="worker-last-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Kowalski"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="worker-priority">Priorytet</Label>
        <select
          id="worker-priority"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {PRIORITY_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" disabled={!canSubmit}>
          {createWorker.isPending ? 'Dodawanie…' : 'Zapisz'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Anuluj
        </Button>
      </div>
      {createWorker.isError && (
        <p className="text-sm text-destructive sm:col-span-2 lg:col-span-4">
          Nie udało się dodać pracownika.
        </p>
      )}
    </form>
  );
}
