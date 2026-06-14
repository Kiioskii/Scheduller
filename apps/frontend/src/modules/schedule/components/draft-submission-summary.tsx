import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { useReceivedDrafts } from '@/modules/drafts';

import type { ScheduleMonth } from '../lib/schedule-month';
import { formatScheduleMonth } from '../lib/schedule-month';

type DraftSubmissionSummaryProps = {
  month: ScheduleMonth;
};

export function DraftSubmissionSummary({ month }: DraftSubmissionSummaryProps) {
  const { data = [], isLoading, isError, error } = useReceivedDrafts(month);

  const stats = useMemo(() => {
    const activeWorkers = data.filter((worker) => !worker.deleted);
    const submittedCount = activeWorkers.filter((worker) => worker.received).length;

    return {
      activeWorkers: activeWorkers.length,
      submittedCount,
    };
  }, [data]);

  const allSubmitted =
    stats.activeWorkers > 0 && stats.submittedCount === stats.activeWorkers;
  const noneSubmitted = stats.submittedCount === 0;

  return (
    <section className="rounded-lg border bg-muted/20 p-4">
      <h3 className="text-sm font-medium">Podkłady za {formatScheduleMonth(month)}</h3>

      {isLoading && <p className="mt-2 text-sm text-muted-foreground">Ładowanie statusów podkładów…</p>}

      {isError && (
        <p className="mt-2 text-sm text-destructive">
          Nie udało się pobrać statusów podkładów.
          {error instanceof Error && error.message ? ` (${error.message})` : null}
        </p>
      )}

      {!isLoading && !isError && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-2xl font-semibold tracking-tight">
            {stats.submittedCount}{' '}
            <span className="text-base font-normal text-muted-foreground">
              z {stats.activeWorkers} pracowników
            </span>
          </p>
          <span
            className={cn(
              'inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium',
              allSubmitted
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : noneSubmitted
                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                  : 'bg-sky-500/10 text-sky-800 dark:text-sky-300',
            )}
          >
            {allSubmitted
              ? 'Wszyscy przesłali podkłady'
              : noneSubmitted
                ? 'Brak przesłanych podkładów'
                : 'Część pracowników przesłała podkłady'}
          </span>
        </div>
      )}
    </section>
  );
}
