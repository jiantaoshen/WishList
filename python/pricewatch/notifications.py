import json
import os
import smtplib

from email.message import EmailMessage
from pathlib import Path

from pricewatch.models import ScrapeResult
from pricewatch.run import RunMetadata

# ============================================================
# Default Notification State
# ============================================================

def get_default_state() -> dict:

    return {
        "products": {},
        "last_failed_run_id": None,
    }


# ============================================================
# Load Notification State
# ============================================================

def load_notification_state(
    file_path: Path,
) -> dict:

    if not file_path.exists():
        return get_default_state()

    try:

        with open(
            file_path,
            "r",
            encoding="utf-8",
        ) as f:

            data = json.load(f)

        if not isinstance(data, dict):
            return get_default_state()

        data.setdefault(
            "products",
            {},
        )

        data.setdefault(
            "last_failed_run_id",
            None,
        )

        return data

    except (
        OSError,
        json.JSONDecodeError,
    ):

        return get_default_state()


# ============================================================
# Save Notification State
# ============================================================

def save_notification_state(
    file_path: Path,
    state: dict,
) -> None:

    file_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        file_path,
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(
            state,
            f,
            ensure_ascii=False,
            indent=2,
        )


# ============================================================
# Send Email
# ============================================================

def send_email_notification(
    subject: str,
    body: str,
) -> bool:

    smtp_host = os.getenv(
        "SMTP_HOST"
    )

    smtp_port_text = os.getenv(
        "SMTP_PORT",
        "587",
    )

    smtp_user = os.getenv(
        "SMTP_USER"
    )

    smtp_password = os.getenv(
        "SMTP_PASSWORD"
    )

    email_from = os.getenv(
        "EMAIL_FROM"
    )

    email_to = os.getenv(
        "EMAIL_TO"
    )

    # ========================================================
    # Validate configuration
    # ========================================================

    required_values = {
        "SMTP_HOST": smtp_host,
        "SMTP_USER": smtp_user,
        "SMTP_PASSWORD": smtp_password,
        "EMAIL_FROM": email_from,
        "EMAIL_TO": email_to,
    }

    missing = [
        key
        for key, value
        in required_values.items()
        if not value
    ]

    if missing:

        print(
            "ℹ️ Email notifications disabled. "
            "Missing environment variables: "
            + ", ".join(missing)
        )

        return False

    try:

        smtp_port = int(
            smtp_port_text
        )

    except ValueError:

        print(
            "❌ Invalid SMTP_PORT"
        )

        return False

    # ========================================================
    # Build email
    # ========================================================

    message = EmailMessage()

    message["Subject"] = subject
    message["From"] = email_from
    message["To"] = email_to

    message.set_content(
        body
    )

    # ========================================================
    # Send
    # ========================================================

    try:

        with smtplib.SMTP(
            smtp_host,
            smtp_port,
            timeout=15,
        ) as server:

            server.ehlo()

            server.starttls()

            server.ehlo()

            server.login(
                smtp_user,
                smtp_password,
            )

            server.send_message(
                message
            )

        print(
            f"📧 Email sent: "
            f"{subject}"
        )

        return True

    except Exception as e:

        print(
            f"❌ Email notification failed: "
            f"{e}"
        )

        return False


# ============================================================
# Product Notification Event
# ============================================================

def handle_product_notification(
    result: ScrapeResult,
    state: dict,
) -> dict | None:
    """
    Inspect one product result.

    Returns:
        dict:
            Notification event that should be included
            in the summary email.

        None:
            No notification is required.

    This function does NOT mark an alert as sent.
    That happens only after the summary email succeeds.
    """

    products_state = state.setdefault(
        "products",
        {},
    )

    product_state = (
        products_state.setdefault(
            result.product_id,
            {
                "target_alert_active": False,
                "last_suspicious_price": None,
            },
        )
    )

    # ========================================================
    # Successful result
    # ========================================================

    if result.status == "success":

        # ----------------------------------------------------
        # A normal valid result clears previous
        # suspicious-price state.
        # ----------------------------------------------------

        if (
            product_state.get(
                "last_suspicious_price"
            )
            is not None
        ):

            product_state[
                "last_suspicious_price"
            ] = None

        if result.current_price is None:
            return None

        target_reached = (
            result.current_price
            <= result.target_price
        )

        # ----------------------------------------------------
        # Target reached
        # ----------------------------------------------------

        if target_reached:

            already_alerted = (
                product_state.get(
                    "target_alert_active",
                    False,
                )
            )

            if already_alerted:
                return None

            return {
                "type": "TARGET_REACHED",
                "product_id": (
                    result.product_id
                ),
                "product": (
                    result.name
                ),
                "current_price": (
                    result.current_price
                ),
                "target_price": (
                    result.target_price
                ),
                "currency": (
                    result.currency
                ),
                "url": (
                    result.url
                ),
            }

        # ----------------------------------------------------
        # Price went above target again.
        #
        # Re-arm future target notification.
        # ----------------------------------------------------

        if product_state.get(
            "target_alert_active",
            False,
        ):

            product_state[
                "target_alert_active"
            ] = False

        return None

    # ========================================================
    # Suspicious result
    # ========================================================

    if result.status == "suspicious":

        if result.current_price is None:
            return None

        last_suspicious_price = (
            product_state.get(
                "last_suspicious_price"
            )
        )

        # Same suspicious price was already reported.
        if (
            last_suspicious_price
            == result.current_price
        ):

            return None

        return {
            "type": "SUSPICIOUS_PRICE",
            "product_id": (
                result.product_id
            ),
            "product": (
                result.name
            ),
            "current_price": (
                result.current_price
            ),
            "previous_price": (
                result.previous_price
            ),
            "currency": (
                result.currency
            ),
            "url": (
                result.url
            ),
            "reason": (
                result.error.message
                if result.error
                else None
            ),
        }

    # ========================================================
    # Failed product
    #
    # Product-level failures are currently not emailed.
    # Run-level failure will handle complete run failures.
    # ========================================================

    return None


# ============================================================
# Run Notification Event
# ============================================================

def handle_run_notification(
    run_metadata: RunMetadata,
    state: dict,
) -> dict | None:

    if (
        run_metadata.status
        != "failed"
    ):

        return None

    if (
        state.get(
            "last_failed_run_id"
        )
        == run_metadata.run_id
    ):

        return None

    return {
        "type": "RUN_FAILED",
        "run_id": (
            run_metadata.run_id
        ),
        "total_products": (
            run_metadata.total_products
        ),
        "successful": (
            run_metadata.successful
        ),
        "failed": (
            run_metadata.failed
        ),
        "suspicious": (
            run_metadata.suspicious
        ),
        "duration_seconds": (
            run_metadata.duration_seconds
        ),
    }


# ============================================================
# Build and Send Summary Email
# ============================================================

def send_summary_notification(
    events: list[dict],
) -> bool:

    if not events:
        return False

    target_events = [
        event
        for event in events
        if event.get("type")
        == "TARGET_REACHED"
    ]

    suspicious_events = [
        event
        for event in events
        if event.get("type")
        == "SUSPICIOUS_PRICE"
    ]

    failed_run_events = [
        event
        for event in events
        if event.get("type")
        == "RUN_FAILED"
    ]

    lines = []

    # ========================================================
    # Target reached
    # ========================================================

    if target_events:

        lines.append(
            "TARGET PRICES REACHED"
        )

        lines.append(
            "=" * 40
        )

        for event in target_events:

            lines.append(
                ""
            )

            lines.append(
                event["product"]
            )

            lines.append(
                f"Current: "
                f"{event['current_price']:.2f} "
                f"{event['currency']}"
            )

            lines.append(
                f"Target: "
                f"{event['target_price']:.2f} "
                f"{event['currency']}"
            )

            lines.append(
                event["url"]
            )

    # ========================================================
    # Suspicious prices
    # ========================================================

    if suspicious_events:

        if lines:
            lines.append("")

        lines.append(
            "SUSPICIOUS PRICES"
        )

        lines.append(
            "=" * 40
        )

        for event in suspicious_events:

            lines.append(
                ""
            )

            lines.append(
                event["product"]
            )

            lines.append(
                f"Current: "
                f"{event['current_price']:.2f} "
                f"{event['currency']}"
            )

            previous_price = (
                event.get(
                    "previous_price"
                )
            )

            if previous_price is not None:

                lines.append(
                    f"Previous: "
                    f"{previous_price:.2f} "
                    f"{event['currency']}"
                )

            reason = event.get(
                "reason"
            )

            if reason:

                lines.append(
                    f"Reason: {reason}"
                )

            lines.append(
                event["url"]
            )

    # ========================================================
    # Failed run
    # ========================================================

    if failed_run_events:

        if lines:
            lines.append("")

        lines.append(
            "RUN FAILED"
        )

        lines.append(
            "=" * 40
        )

        for event in failed_run_events:

            lines.append(
                ""
            )

            lines.append(
                f"Run ID: "
                f"{event['run_id']}"
            )

            lines.append(
                f"Total products: "
                f"{event['total_products']}"
            )

            lines.append(
                f"Successful: "
                f"{event['successful']}"
            )

            lines.append(
                f"Failed: "
                f"{event['failed']}"
            )

            lines.append(
                f"Suspicious: "
                f"{event['suspicious']}"
            )

            lines.append(
                f"Duration: "
                f"{event['duration_seconds']:.2f}s"
            )

    # ========================================================
    # Subject
    # ========================================================

    alert_count = len(events)

    if alert_count == 1:

        subject = (
            "Price Watch: 1 alert"
        )

    else:

        subject = (
            f"Price Watch: "
            f"{alert_count} alerts"
        )

    body = "\n".join(
        lines
    )

    return send_email_notification(
        subject=subject,
        body=body,
    )


# ============================================================
# Mark Successfully Sent Events
# ============================================================

def mark_notification_events_sent(
    events: list[dict],
    state: dict,
) -> None:
    """
    Update dedup state AFTER the summary email
    has been successfully sent.
    """

    products_state = state.setdefault(
        "products",
        {},
    )

    for event in events:

        event_type = event.get(
            "type"
        )

        # ====================================================
        # Target reached
        # ====================================================

        if (
            event_type
            == "TARGET_REACHED"
        ):

            product_id = event[
                "product_id"
            ]

            product_state = (
                products_state.setdefault(
                    product_id,
                    {
                        "target_alert_active": False,
                        "last_suspicious_price": None,
                    },
                )
            )

            product_state[
                "target_alert_active"
            ] = True

        # ====================================================
        # Suspicious price
        # ====================================================

        elif (
            event_type
            == "SUSPICIOUS_PRICE"
        ):

            product_id = event[
                "product_id"
            ]

            product_state = (
                products_state.setdefault(
                    product_id,
                    {
                        "target_alert_active": False,
                        "last_suspicious_price": None,
                    },
                )
            )

            product_state[
                "last_suspicious_price"
            ] = event[
                "current_price"
            ]

        # ====================================================
        # Failed run
        # ====================================================

        elif (
            event_type
            == "RUN_FAILED"
        ):

            state[
                "last_failed_run_id"
            ] = event[
                "run_id"
            ]