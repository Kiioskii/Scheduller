import { useState } from 'react';
import { Download, Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  formatScheduleTitle,
  getCurrentScheduleMonth,
  ImportSchedulesForm,
  ScheduleMonthPicker,
  useScheduleMutations,
  type ScheduleMonth,
} from '@/modules/schedule';

export function DashboardSchedulesPage() {
  const [selectedMonth, setSelectedMonth] = useState<ScheduleMonth>(getCurrentScheduleMonth);
  const [showImportForm, setShowImportForm] = useState(false);
  const { downloadPodklad } = useScheduleMutations();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Grafiki</h2>
          <p className="text-sm text-muted-foreground">
            Wybierz miesiąc, pobierz podkład lub importuj pliki Excel z grafikami.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={downloadPodklad.isPending}
            onClick={() =>
              downloadPodklad.mutate({
                year: selectedMonth.year,
                month: selectedMonth.month,
              })
            }
          >
            {downloadPodklad.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Pobierz podkład
          </Button>
          <Button
            type="button"
            variant={showImportForm ? 'secondary' : 'outline'}
            onClick={() => setShowImportForm((open) => !open)}
          >
            <Upload className="size-4" />
            {showImportForm ? 'Anuluj import' : 'Importuj z Excela'}
          </Button>
        </div>
      </div>

      {downloadPodklad.isError && (
        <p className="text-sm text-destructive">Nie udało się pobrać podkładu.</p>
      )}

      <ScheduleMonthPicker value={selectedMonth} onChange={setSelectedMonth} />

      {showImportForm && (
        <ImportSchedulesForm
          defaultMonth={selectedMonth}
          onClose={() => setShowImportForm(false)}
        />
      )}

      <h3 className="text-base font-semibold tracking-tight">{formatScheduleTitle(selectedMonth)}</h3>
    </div>
  );
}
