import { HolidaysTable } from '@/modules/holidays';

export function DashboardHolidaysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Święta</h2>
        <p className="text-sm text-muted-foreground">
          Zarządzaj świętami państwowymi i firmowymi dla wybranego roku.
        </p>
      </div>
      <HolidaysTable />
    </div>
  );
}
