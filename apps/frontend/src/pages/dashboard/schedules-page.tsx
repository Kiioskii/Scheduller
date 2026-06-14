import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DraftSubmissionSummary,
  GeneratedSchedulesTable,
  ScheduleMonthPicker,
  formatScheduleMonth,
  getCurrentScheduleMonth,
  useGeneratedSchedules,
  type ScheduleMonth,
} from '@/modules/schedule';

export function DashboardSchedulesPage() {
  const [selectedMonth, setSelectedMonth] = useState<ScheduleMonth>(getCurrentScheduleMonth);
  const { schedules, generateSchedule, isGenerating, error, clearError } = useGeneratedSchedules();

  function handleGenerateSchedule() {
    generateSchedule(selectedMonth);
  }

  function handleMonthChange(month: ScheduleMonth) {
    clearError();
    setSelectedMonth(month);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Grafiki</h2>
          <p className="text-sm text-muted-foreground">
            Przegląd wygenerowanych grafików i status podkładów za wybrany miesiąc.
          </p>
        </div>
        <Button
          type="button"
          disabled={isGenerating}
          onClick={handleGenerateSchedule}
        >
          {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Wygeneruj grafik
        </Button>
      </div>

      <ScheduleMonthPicker value={selectedMonth} onChange={handleMonthChange} />

      <DraftSubmissionSummary month={selectedMonth} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-sm text-muted-foreground">
        Wybrany miesiąc do generowania: <strong>{formatScheduleMonth(selectedMonth)}</strong>
      </p>

      <GeneratedSchedulesTable schedules={schedules} />
    </div>
  );
}
