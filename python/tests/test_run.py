from datetime import datetime, timedelta

from pricewatch.run import (
    build_run_metadata,
)


def test_successful_run():

    started = datetime(
        2026,
        8,
        24,
        8,
        0,
        0,
    )

    finished = (
        started
        + timedelta(seconds=30)
    )

    result = build_run_metadata(
        run_id="test-run",
        started_at=started,
        finished_at=finished,
        total_products=10,
        successful=10,
        failed=0,
        suspicious=0,
    )

    assert result.status == "success"
    assert result.duration_seconds == 30

def test_degraded_run():

    started = datetime(
        2026,
        8,
        24,
        8,
        0,
        0,
    )

    finished = (
        started
        + timedelta(seconds=30)
    )

    result = build_run_metadata(
        run_id="test-run",
        started_at=started,
        finished_at=finished,
        total_products=10,
        successful=8,
        failed=1,
        suspicious=1,
    )

    assert result.status == "degraded"

def test_failed_run():

    started = datetime(
        2026,
        8,
        24,
        8,
        0,
        0,
    )

    finished = (
        started
        + timedelta(seconds=30)
    )

    result = build_run_metadata(
        run_id="test-run",
        started_at=started,
        finished_at=finished,
        total_products=10,
        successful=0,
        failed=10,
        suspicious=0,
    )

    assert result.status == "failed"