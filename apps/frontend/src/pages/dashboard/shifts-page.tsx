import { ShiftTemplatesTable } from '@/modules/shifts';

export function DashboardShiftsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Zmiany</h2>
        <p className="text-sm text-muted-foreground">
          Definiuj szablony zmian: rola, liczba pracowników, godziny oraz dni tygodnia.
        </p>
      </div>
      <ShiftTemplatesTable />
    </div>
  );
}
