import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';

import { AddShiftTemplateForm } from './add-shift-template-form';

type AddShiftTemplateDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AddShiftTemplateDialog({ open, onClose }: AddShiftTemplateDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="z-60 m-auto flex max-h-[min(92vh,48rem)] w-[calc(100%-2rem)] max-w-3xl flex-col rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Nowy szablon zmian</h2>
            <p className="text-sm text-muted-foreground">
              Każda zmiana: rola, liczba osób, godziny oraz dni tygodnia (Poniedziałek–Niedziela).
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Zamknij
          </Button>
        </div>

        <AddShiftTemplateForm onClose={onClose} />
      </div>
    </dialog>,
    document.body,
  );
}
