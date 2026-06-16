import { useCallback, useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import {
  CALENDAR_WEEKDAY_LABELS,
  getMonthCalendarWeeks,
  toScheduleDate,
} from '../lib/schedule-calendar';
import { formatScheduleMonth, type ScheduleMonth } from '../lib/schedule-month';

type ScheduleMonthCalendarProps = {
  month: ScheduleMonth;
  selectedDates: ReadonlySet<string>;
  assignments: Readonly<Record<string, string>>;
  templateNames: Readonly<Record<string, string>>;
  onSelectedDatesChange: (dates: Set<string>) => void;
};

type DragState = {
  startDate: string;
  mode: 'select' | 'deselect';
  dragged: boolean;
};

const TEMPLATE_BADGE_CLASSES = [
  'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  'bg-violet-500/15 text-violet-800 dark:text-violet-300',
  'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  'bg-rose-500/15 text-rose-800 dark:text-rose-300',
  'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300',
] as const;

function getTemplateBadgeClass(templateId: string, templateIndex: Map<string, number>): string {
  const index = templateIndex.get(templateId) ?? 0;
  return TEMPLATE_BADGE_CLASSES[index % TEMPLATE_BADGE_CLASSES.length];
}

export function ScheduleMonthCalendar({
  month,
  selectedDates,
  assignments,
  templateNames,
  onSelectedDatesChange,
}: ScheduleMonthCalendarProps) {
  const weeks = getMonthCalendarWeeks(month);
  const templateIndex = new Map(
    Object.keys(templateNames).map((templateId, index) => [templateId, index]),
  );

  const selectedDatesRef = useRef(selectedDates);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    selectedDatesRef.current = selectedDates;
  }, [selectedDates]);

  const applyDate = useCallback(
    (date: string, mode: 'select' | 'deselect') => {
      const next = new Set(selectedDatesRef.current);
      if (mode === 'select') {
        next.add(date);
      } else {
        next.delete(date);
      }
      onSelectedDatesChange(next);
    },
    [onSelectedDatesChange],
  );

  const toggleDate = useCallback(
    (date: string) => {
      const next = new Set(selectedDatesRef.current);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      onSelectedDatesChange(next);
    },
    [onSelectedDatesChange],
  );

  const handlePointerDown = useCallback(
    (date: string) => {
      dragRef.current = {
        startDate: date,
        mode: selectedDatesRef.current.has(date) ? 'deselect' : 'select',
        dragged: false,
      };
    },
    [],
  );

  const handlePointerEnter = useCallback(
    (date: string) => {
      const drag = dragRef.current;
      if (!drag) return;

      if (!drag.dragged) {
        drag.dragged = true;
        applyDate(drag.startDate, drag.mode);
      }

      applyDate(date, drag.mode);
    },
    [applyDate],
  );

  useEffect(() => {
    function handlePointerUp() {
      const drag = dragRef.current;
      if (!drag) return;

      if (!drag.dragged) {
        toggleDate(drag.startDate);
      }

      dragRef.current = null;
    }

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [toggleDate]);

  return (
    <div className="space-y-3 select-none">
      <p className="text-sm font-medium">{formatScheduleMonth(month)}</p>
      <p className="text-xs text-muted-foreground">
        Kliknij dzień lub przeciągnij myszką, aby zaznaczyć wiele dni.
      </p>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {CALENDAR_WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-1 touch-none">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <div key={`empty-${weekIndex}-${dayIndex}`} className="min-h-16" />;
              }

              const date = toScheduleDate(month, day);
              const isSelected = selectedDates.has(date);
              const templateId = assignments[date];
              const templateName = templateId ? templateNames[templateId] : undefined;

              return (
                <div
                  key={date}
                  role="button"
                  tabIndex={0}
                  onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.preventDefault();
                    handlePointerDown(date);
                  }}
                  onPointerEnter={() => handlePointerEnter(date)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleDate(date);
                    }
                  }}
                  className={cn(
                    'flex min-h-16 cursor-pointer flex-col items-center justify-start rounded-md border px-1 py-2 text-left transition-colors',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40',
                    templateId && !isSelected && 'bg-muted/20',
                  )}
                  aria-pressed={isSelected}
                  aria-label={
                    templateName
                      ? `Dzień ${day}, szablon: ${templateName}`
                      : `Dzień ${day}, brak szablonu`
                  }
                >
                  <span className="w-full text-center text-sm font-medium">{day}</span>
                  {templateName && (
                    <span
                      className={cn(
                        'mt-1 line-clamp-2 w-full rounded px-1 py-0.5 text-center text-[10px] leading-tight font-medium',
                        getTemplateBadgeClass(templateId, templateIndex),
                      )}
                      title={templateName}
                    >
                      {templateName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
