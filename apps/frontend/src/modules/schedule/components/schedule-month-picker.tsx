import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  formatScheduleMonth,
  isSameScheduleMonth,
  MONTH_LABELS,
  type ScheduleMonth,
} from '../lib/schedule-month';

type ScheduleMonthPickerProps = {
  value: ScheduleMonth;
  onChange: (value: ScheduleMonth) => void;
  className?: string;
  defaultExpanded?: boolean;
};

export function ScheduleMonthPicker({
  value,
  onChange,
  className,
  defaultExpanded = false,
}: ScheduleMonthPickerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  function selectMonth(month: number) {
    onChange({ year: value.year, month });
  }

  function changeYear(delta: number) {
    onChange({ year: value.year + delta, month: value.month });
  }

  return (
    <section className={cn('w-full max-w-md rounded-lg border bg-card', className)}>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          aria-expanded={expanded}
          aria-controls="schedule-month-picker-panel"
        >
          {expanded ? (
            <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate font-medium">{formatScheduleMonth(value)}</span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs text-muted-foreground"
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? 'Zwiń' : 'Zmień'}
        </Button>
      </div>

      {expanded && (
        <div id="schedule-month-picker-panel" className="border-t px-3 pb-3 pt-2">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => changeYear(-1)}
              aria-label="Poprzedni rok"
            >
              <ChevronLeft className="size-3.5" />
            </Button>

            <p className="text-sm font-semibold tabular-nums">{value.year}</p>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => changeYear(1)}
              aria-label="Następny rok"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          <div
            className="mt-2 grid grid-cols-3 gap-1.5"
            role="listbox"
            aria-label={`Miesiące w roku ${value.year}`}
          >
            {MONTH_LABELS.map((label, index) => {
              const month = index + 1;
              const selected = isSameScheduleMonth(value, { year: value.year, month });

              return (
                <button
                  key={label}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectMonth(month)}
                  className={cn(
                    'rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors',
                    'hover:bg-muted/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border-input bg-background text-foreground',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
