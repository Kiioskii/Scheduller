"""Time parsing and overlap helpers."""

from __future__ import annotations

import re
from typing import TypeAlias

TimeRange: TypeAlias = tuple[str, str]

_TIME_RANGE_PATTERN = re.compile(
    r"(\d{1,2})(?::(\d{2}))?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?",
)


def format_time(hour: int, minute: int = 0) -> str:
    return f"{hour:02d}:{minute:02d}"


def time_to_minutes(value: str) -> int:
    hour_str, minute_str = value.split(":", 1)
    return int(hour_str) * 60 + int(minute_str)


def parse_time_range_text(value: str) -> TimeRange | None:
    match = _TIME_RANGE_PATTERN.search(value.strip())
    if not match:
        return None

    start_hour = int(match.group(1))
    start_minute = int(match.group(2) or 0)
    end_hour = int(match.group(3))
    end_minute = int(match.group(4) or 0)

    start = format_time(start_hour, start_minute)
    end = format_time(end_hour, end_minute)
    if time_to_minutes(start) >= time_to_minutes(end):
        return None
    return start, end


def parse_hour_pair(start_value: object, end_value: object) -> TimeRange | None:
    if not isinstance(start_value, (int, float)) or not isinstance(end_value, (int, float)):
        return None

    start_hour = int(start_value)
    end_hour = int(end_value)
    if start_hour < 0 or end_hour > 24 or start_hour >= end_hour:
        return None

    return format_time(start_hour), format_time(end_hour)


def ranges_overlap(shift_start: str, shift_end: str, range_start: str, range_end: str) -> bool:
    return time_to_minutes(shift_start) < time_to_minutes(range_end) and time_to_minutes(
        range_start
    ) < time_to_minutes(shift_end)


def merge_time_ranges(ranges: list[TimeRange]) -> list[TimeRange]:
    if not ranges:
        return []

    sorted_ranges = sorted(ranges, key=lambda item: time_to_minutes(item[0]))
    merged: list[TimeRange] = [sorted_ranges[0]]

    for start, end in sorted_ranges[1:]:
        last_start, last_end = merged[-1]
        if time_to_minutes(start) <= time_to_minutes(last_end):
            if time_to_minutes(end) > time_to_minutes(last_end):
                merged[-1] = (last_start, end)
            continue
        merged.append((start, end))

    return merged


def shift_contained_in_ranges(shift_start: str, shift_end: str, ranges: list[TimeRange]) -> bool:
    shift_start_minutes = time_to_minutes(shift_start)
    shift_end_minutes = time_to_minutes(shift_end)
    for range_start, range_end in merge_time_ranges(ranges):
        if time_to_minutes(range_start) <= shift_start_minutes and shift_end_minutes <= time_to_minutes(
            range_end
        ):
            return True
    return False


def has_full_day_availability(ranges: list[TimeRange]) -> bool:
    for range_start, range_end in merge_time_ranges(ranges):
        if time_to_minutes(range_start) <= time_to_minutes("08:00") and time_to_minutes(
            range_end
        ) >= time_to_minutes("22:00"):
            return True
        if time_to_minutes(range_end) - time_to_minutes(range_start) >= 13 * 60:
            return True
    return False


def is_standard_morning_shift(start: str, end: str) -> bool:
    return (
        time_to_minutes(start) <= time_to_minutes("08:30")
        and time_to_minutes("15:00") <= time_to_minutes(end) <= time_to_minutes("15:30")
    )


def is_standard_afternoon_shift(start: str, end: str) -> bool:
    return (
        time_to_minutes("15:00") <= time_to_minutes(start) <= time_to_minutes("15:15")
        and time_to_minutes(end) >= time_to_minutes("22:00")
    )


def is_standard_half_day_shift(start: str, end: str) -> bool:
    return is_standard_morning_shift(start, end) or is_standard_afternoon_shift(start, end)
