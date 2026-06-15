import { cn } from '@/lib/utils';

import {
  formatHolidayHour,
  HOLIDAY_HOUR_OPTIONS,
  parseHolidayHourSelectValue,
} from '../lib/holiday-hours';

type HolidayHourSelectProps = {
  id?: string;
  value: number | null;
  disabled?: boolean;
  allowEmpty?: boolean;
  className?: string;
  'aria-label'?: string;
  onChange: (hour: number | null) => void;
};

const selectClassName =
  'h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50';

export function HolidayHourSelect({
  id,
  value,
  disabled = false,
  allowEmpty = true,
  className,
  'aria-label': ariaLabel,
  onChange,
}: HolidayHourSelectProps) {
  return (
    <select
      id={id}
      value={value ?? ''}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(parseHolidayHourSelectValue(e.target.value))}
      className={cn(selectClassName, className)}
    >
      {allowEmpty && <option value="">—</option>}
      {HOLIDAY_HOUR_OPTIONS.map((hour) => (
        <option key={hour} value={hour}>
          {formatHolidayHour(hour)}
        </option>
      ))}
    </select>
  );
}
