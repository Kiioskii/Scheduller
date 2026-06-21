import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { GenerateScheduleResult } from '@scheduler/shared';

import { Button } from '@/components/ui/button';
import {
  DraftSubmissionSummary,
  GeneratedSchedulesTable,
  GenerateScheduleDialog,
  ScheduleMonthPicker,
  SchedulePreviewDialog,
  filterSchedulesByMonth,
  formatScheduleMonth,
  getCurrentScheduleMonth,
  useGeneratedSchedules,
  type GeneratedSchedule,
  type PendingSchedulePreview,
  type ScheduleDayAssignment,
  type ScheduleMonth,
} from '@/modules/schedule';

export function DashboardSchedulesPage() {
  const [selectedMonth, setSelectedMonth] = useState<ScheduleMonth>(getCurrentScheduleMonth);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<PendingSchedulePreview | null>(null);
  const [previewReadOnly, setPreviewReadOnly] = useState(false);
  const [lastDayAssignments, setLastDayAssignments] = useState<ScheduleDayAssignment[]>([]);
  const { schedules, generateSchedule, acceptSchedule, isGenerating, isAccepting, error, clearError } =
    useGeneratedSchedules();
  const monthSchedules = useMemo(
    () => filterSchedulesByMonth(schedules, selectedMonth),
    [schedules, selectedMonth],
  );

  function handleMonthChange(month: ScheduleMonth) {
    clearError();
    setSelectedMonth(month);
  }

  async function handleGenerate(dayAssignments: ScheduleDayAssignment[]) {
    const result = await generateSchedule(selectedMonth, dayAssignments);
    if (!result) {
      return;
    }

    setLastDayAssignments(dayAssignments);
    setPreviewReadOnly(false);
    setPendingPreview({ result, preview: result.preview });
    setShowGenerateDialog(false);
  }

  function handleAcceptPreview(pending: PendingSchedulePreview) {
    acceptSchedule(pending.result, lastDayAssignments);
    setPendingPreview(null);
    clearError();
  }

  function openSavedPreview(schedule: GeneratedSchedule) {
    if (!schedule.preview) return;
    const result: GenerateScheduleResult = {
      jobId: schedule.jobId ?? schedule.id,
      year: schedule.year,
      month: schedule.month,
      status: schedule.solverStatus === 'infeasible' ? 'failed' : 'accepted',
      draftCount: 0,
      holidayCount: 0,
      assignmentCount: schedule.assignmentCount ?? 0,
      solverStatus: schedule.solverStatus ?? 'feasible',
      message: schedule.message ?? 'Zaakceptowany grafik',
      preview: schedule.preview,
      unassignedSlotIds: [],
    };
    setPendingPreview({ result, preview: schedule.preview });
    setPreviewReadOnly(true);
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

      {error && !showGenerateDialog && !pendingPreview && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <p className="text-sm text-muted-foreground">
        Wybrany miesiąc do generowania: <strong>{formatScheduleMonth(selectedMonth)}</strong>
      </p>

      <GeneratedSchedulesTable schedules={monthSchedules} onPreview={openSavedPreview} />

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

      <SchedulePreviewDialog
        open={pendingPreview !== null}
        pending={pendingPreview}
        isAccepting={isAccepting}
        readOnly={previewReadOnly}
        onClose={() => setPendingPreview(null)}
        onAccept={handleAcceptPreview}
      />
    </div>
  );
}
