import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DraftSubmissionSummary,
  GeneratedSchedulesTable,
  GenerateScheduleDialog,
  ScheduleMonthPicker,
  filterSchedulesByMonth,
  formatScheduleMonth,
  getCurrentScheduleMonth,
  useGeneratedSchedules,
  type ScheduleDayAssignment,
  type ScheduleMonth,
} from '@/modules/schedule';

export function DashboardSchedulesPage() {
  const [selectedMonth, setSelectedMonth] = useState<ScheduleMonth>(getCurrentScheduleMonth);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const { schedules, generateSchedule, isGenerating, error, clearError } = useGeneratedSchedules();
  const monthSchedules = useMemo(
    () => filterSchedulesByMonth(schedules, selectedMonth),
    [schedules, selectedMonth],
  );

  function handleMonthChange(month: ScheduleMonth) {
    clearError();
    setSelectedMonth(month);
  }

  async function handleGenerate(dayAssignments: ScheduleDayAssignment[]) {
    const success = await generateSchedule(selectedMonth, dayAssignments);
    if (success) {
      setShowGenerateDialog(false);
    }
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
        <Button type="button" onClick={() => setShowGenerateDialog(true)}>
          <Sparkles className="size-4" />
          Wygeneruj grafik
        </Button>
      </div>

      <ScheduleMonthPicker value={selectedMonth} onChange={handleMonthChange} />

      <DraftSubmissionSummary month={selectedMonth} />

      {error && !showGenerateDialog && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-sm text-muted-foreground">
        Wybrany miesiąc do generowania: <strong>{formatScheduleMonth(selectedMonth)}</strong>
      </p>

      <GeneratedSchedulesTable schedules={monthSchedules} />

      <GenerateScheduleDialog
        open={showGenerateDialog}
        month={selectedMonth}
        isGenerating={isGenerating}
        error={error}
        onClose={() => {
          clearError();
          setShowGenerateDialog(false);
        }}
        onGenerate={handleGenerate}
        onClearError={clearError}
      />
    </div>
  );
}
