from scheduler_engine.services.time_range import (
    has_full_day_availability,
    is_standard_half_day_shift,
    merge_time_ranges,
    parse_hour_pair,
    parse_time_range_text,
    ranges_overlap,
    shift_contained_in_ranges,
)


def test_parse_time_range_text() -> None:
    assert parse_time_range_text("8:00-15:15") == ("08:00", "15:15")
    assert parse_time_range_text("10:00 - 14:00") == ("10:00", "14:00")


def test_parse_hour_pair() -> None:
    assert parse_hour_pair(13, 22) == ("13:00", "22:00")


def test_ranges_overlap() -> None:
    assert ranges_overlap("08:00", "16:00", "08:00", "15:15") is True
    assert ranges_overlap("16:00", "22:00", "08:00", "15:15") is False


def test_merge_time_ranges() -> None:
    merged = merge_time_ranges([("08:00", "15:15"), ("15:00", "22:00")])
    assert merged == [("08:00", "22:00")]


def test_shift_contained_in_ranges() -> None:
    ranges = [("08:00", "22:00")]
    assert shift_contained_in_ranges("08:00", "15:15", ranges) is True
    assert shift_contained_in_ranges("10:00", "20:00", ranges) is True
    assert shift_contained_in_ranges("08:00", "12:00", ranges) is True
    assert shift_contained_in_ranges("16:00", "20:00", ranges) is True
    assert shift_contained_in_ranges("08:00", "22:30", ranges) is False

    split_ranges = [("08:00", "12:00"), ("16:00", "20:00")]
    assert shift_contained_in_ranges("08:00", "12:00", split_ranges) is True
    assert shift_contained_in_ranges("08:00", "20:00", split_ranges) is False


def test_has_full_day_availability() -> None:
    assert has_full_day_availability([("08:00", "22:00")]) is True
    assert has_full_day_availability([("08:00", "15:15"), ("15:00", "22:00")]) is True
    assert has_full_day_availability([("08:00", "15:15")]) is False


def test_is_standard_half_day_shift() -> None:
    assert is_standard_half_day_shift("08:00", "15:15") is True
    assert is_standard_half_day_shift("15:00", "22:00") is True
    assert is_standard_half_day_shift("10:00", "20:00") is False
