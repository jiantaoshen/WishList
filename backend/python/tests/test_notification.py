from backend.python.pricewatch.models import (
    ScrapeError,
    ScrapeResult,
)

from backend.python.pricewatch.notifications import (
    get_default_state,
    handle_product_notification,
    handle_run_notification,
    mark_notification_events_sent,
)

from backend.python.pricewatch.run import RunMetadata

from datetime import datetime


# ============================================================
# Helpers
# ============================================================

def make_success_result(
    current_price: float,
    target_price: float = 100,
) -> ScrapeResult:

    return ScrapeResult(
        product_id="test-product",
        name="Test Product",
        url="https://example.com/product",
        target_price=target_price,
        status="success",
        current_price=current_price,
        previous_price=120,
        below_target=(
            current_price <= target_price
        ),
        difference=(
            current_price - target_price
        ),
        currency="SEK",
        error=None,
    )


def make_suspicious_result(
    current_price: float,
) -> ScrapeResult:

    return ScrapeResult(
        product_id="test-product",
        name="Test Product",
        url="https://example.com/product",
        target_price=100,
        status="suspicious",
        current_price=current_price,
        previous_price=500,
        below_target=None,
        difference=None,
        currency="SEK",
        error=ScrapeError(
            type="SUSPICIOUS_PRICE",
            message="Price changed too much",
        ),
    )


# ============================================================
# Target reached
# ============================================================

def test_target_reached_creates_event():

    state = get_default_state()

    result = make_success_result(
        current_price=80,
    )

    event = handle_product_notification(
        result,
        state,
    )

    assert event is not None

    assert (
        event["type"]
        == "TARGET_REACHED"
    )

    assert (
        event["current_price"]
        == 80
    )


# ============================================================
# Target alert dedup
# ============================================================

def test_target_alert_is_not_repeated():

    state = get_default_state()

    result = make_success_result(
        current_price=80,
    )

    event = handle_product_notification(
        result,
        state,
    )

    assert event is not None

    mark_notification_events_sent(
        [event],
        state,
    )

    second_event = (
        handle_product_notification(
            result,
            state,
        )
    )

    assert second_event is None


# ============================================================
# Target re-arm
# ============================================================

def test_target_alert_rearms_after_price_rises():

    state = get_default_state()

    # First target alert
    result = make_success_result(
        current_price=80,
    )

    event = handle_product_notification(
        result,
        state,
    )

    mark_notification_events_sent(
        [event],
        state,
    )

    assert (
        state["products"]
        ["test-product"]
        ["target_alert_active"]
        is True
    )

    # Price rises above target
    above_target = make_success_result(
        current_price=120,
    )

    handle_product_notification(
        above_target,
        state,
    )

    assert (
        state["products"]
        ["test-product"]
        ["target_alert_active"]
        is False
    )

    # Price drops below target again
    below_again = make_success_result(
        current_price=90,
    )

    new_event = (
        handle_product_notification(
            below_again,
            state,
        )
    )

    assert new_event is not None

    assert (
        new_event["type"]
        == "TARGET_REACHED"
    )


# ============================================================
# Suspicious price
# ============================================================

def test_suspicious_price_creates_event():

    state = get_default_state()

    result = make_suspicious_result(
        current_price=50,
    )

    event = handle_product_notification(
        result,
        state,
    )

    assert event is not None

    assert (
        event["type"]
        == "SUSPICIOUS_PRICE"
    )


# ============================================================
# Suspicious dedup
# ============================================================

def test_same_suspicious_price_is_not_repeated():

    state = get_default_state()

    result = make_suspicious_result(
        current_price=50,
    )

    event = handle_product_notification(
        result,
        state,
    )

    mark_notification_events_sent(
        [event],
        state,
    )

    second_event = (
        handle_product_notification(
            result,
            state,
        )
    )

    assert second_event is None


# ============================================================
# Failed run
# ============================================================

def test_failed_run_creates_event():

    state = get_default_state()

    now = datetime.now()

    run = RunMetadata(
        run_id="test-run",
        started_at=now,
        finished_at=now,
        duration_seconds=10,
        status="failed",
        total_products=3,
        successful=0,
        failed=3,
        suspicious=0,
    )

    event = handle_run_notification(
        run,
        state,
    )

    assert event is not None

    assert (
        event["type"]
        == "RUN_FAILED"
    )


# ============================================================
# Failed run dedup
# ============================================================

def test_same_failed_run_is_not_repeated():

    state = get_default_state()

    now = datetime.now()

    run = RunMetadata(
        run_id="test-run",
        started_at=now,
        finished_at=now,
        duration_seconds=10,
        status="failed",
        total_products=3,
        successful=0,
        failed=3,
        suspicious=0,
    )

    event = handle_run_notification(
        run,
        state,
    )

    mark_notification_events_sent(
        [event],
        state,
    )

    second_event = (
        handle_run_notification(
            run,
            state,
        )
    )

    assert second_event is None