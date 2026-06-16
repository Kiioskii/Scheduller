import type { Weekday } from '@scheduler/shared';
import { cn } from '@/lib/utils';

import { WEEKDAY_OPTIONS } from '../lib/weekdays';

type WeekdayPickerProps = {
  value: Weekday[];
  disabled?: boolean;
  onChange: (weekdays: Weekday[]) => void;
};

export function WeekdayPicker({ value, disabled = false, onChange }: WeekdayPickerProps) {
  function toggle(day: Weekday) {
    if (disabled) return;

    if (value.includes(day)) {
      onChange(value.filter((current) => current !== day));
      return;
    }
    onChange([...value, day]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {WEEKDAY_OPTIONS.map((day) => {
        const checked = value.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            disabled={disabled}
            aria-pressed={checked}
            onClick={() => toggle(day.value)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
              checked
                ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {day.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
