import { Fragment } from 'react';
import type { SchedulePreview, SchedulePreviewHalfCell } from '@scheduler/shared';

import { cn } from '@/lib/utils';

import { formatScheduleMonth } from '../lib/schedule-month';

type SchedulePreviewTableProps = {
  preview: SchedulePreview;
  compact?: boolean;
};

const FILL_CLASS: Record<SchedulePreviewHalfCell['fill'], string> = {
  none: '',
  yellow: 'bg-[#FFFF99]',
  purple: 'bg-[#CCCCFF]',
};

function HalfCell({ cell, compact }: { cell: SchedulePreviewHalfCell; compact?: boolean }) {
  return (
    <td
      className={cn(
        'border border-border text-center align-middle',
        compact ? 'min-w-[2.25rem] px-0.5 py-0.5 text-[10px]' : 'min-w-[2.75rem] px-1 py-1 text-xs',
        FILL_CLASS[cell.fill],
      )}
    >
      {cell.text ?? ''}
    </td>
  );
}

export function SchedulePreviewTable({ preview, compact = false }: SchedulePreviewTableProps) {
  const headerClass = compact
    ? 'px-0.5 py-1 text-[10px] font-medium'
    : 'px-1 py-1.5 text-xs font-medium';

  const stickyNameClass = cn(
    'sticky z-10 border border-border bg-background',
    compact ? 'px-1 py-1 text-[10px]' : 'px-2 py-1.5 text-xs',
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          Okres: <strong className="text-foreground">{formatScheduleMonth(preview)}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-[#FFFF99] ring-1 ring-border" />
          dostępność rano
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-[#CCCCFF] ring-1 ring-border" />
          dostępność popołudnie
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-max min-w-full border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <th className={cn(headerClass, 'sticky left-0 z-20 bg-muted/50')} colSpan={2} />
              {preview.dayNumbers.map((day, index) => (
                <th key={`weekday-${day}`} className={headerClass} colSpan={2}>
                  {preview.weekdays[index]}
                </th>
              ))}
              <th className={cn(headerClass, 'sticky right-0 z-20 bg-muted/50')} colSpan={2} />
            </tr>
            <tr>
              <th className={cn(headerClass, 'sticky left-0 z-20 bg-muted/50')}>nazwisko</th>
              <th className={cn(headerClass, 'sticky left-0 z-20 bg-muted/50')}>imię</th>
              {preview.dayNumbers.map((day) => (
                <th key={`day-${day}`} className={headerClass} colSpan={2}>
                  {day}
                </th>
              ))}
              <th className={cn(headerClass, 'sticky right-0 z-20 bg-muted/50')}>nazwisko</th>
              <th className={cn(headerClass, 'sticky right-0 z-20 bg-muted/50')}>imię</th>
            </tr>
          </thead>
          <tbody>
            {preview.workers.map((worker) =>
              worker.rows.map((row, rowIndex) => (
                <tr key={`${worker.workerId}-${rowIndex}`} className="border-t">
                  {rowIndex === 0 ? (
                    <>
                      <td
                        rowSpan={worker.rows.length}
                        className={cn(stickyNameClass, 'left-0 font-medium')}
                      >
                        {worker.lastName}
                      </td>
                      <td rowSpan={worker.rows.length} className={cn(stickyNameClass, 'left-0')}>
                        {worker.firstName}
                      </td>
                    </>
                  ) : null}
                  {row.map((cell, dayIndex) => (
                    <Fragment key={`${worker.workerId}-${rowIndex}-${dayIndex}`}>
                      <HalfCell cell={cell.start} compact={compact} />
                      <HalfCell cell={cell.end} compact={compact} />
                    </Fragment>
                  ))}
                  {rowIndex === 0 ? (
                    <>
                      <td
                        rowSpan={worker.rows.length}
                        className={cn(stickyNameClass, 'right-0 font-medium')}
                      >
                        {worker.lastName}
                      </td>
                      <td rowSpan={worker.rows.length} className={cn(stickyNameClass, 'right-0')}>
                        {worker.firstName}
                      </td>
                    </>
                  ) : null}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
