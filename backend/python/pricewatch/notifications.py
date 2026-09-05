import json
import os
import smtplib

from email.message import EmailMessage
from pathlib import Path

from .models import ScrapeResult
from .run import RunMetadata


def get_default_state() -> dict:
    return {"products": {}, "last_failed_run_id": None}


def load_notification_state(file_path: Path) -> dict:
    if not file_path.exists():
        return get_default_state()

    try:
        with file_path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, dict):
            return get_default_state()

        data.setdefault("products", {})
        data.setdefault("last_failed_run_id", None)
        return data

    except (OSError, json.JSONDecodeError):
        return get_default_state()


def save_notification_state(file_path: Path, state: dict) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)

    with file_path.open("w", encoding="utf-8") as file:
        json.dump(state, file, ensure_ascii=False, indent=2)


def send_email_notification(subject: str, body: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM")
    email_to = os.getenv("EMAIL_TO")

    required = {
        "SMTP_HOST": smtp_host,
        "SMTP_USER": smtp_user,
        "SMTP_PASSWORD": smtp_password,
        "EMAIL_FROM": email_from,
        "EMAIL_TO": email_to,
    }

    missing = [key for key, value in required.items() if not value]

    if missing:
        print(
            "ℹ️ Email notifications disabled. Missing environment variables: "
            + ", ".join(missing)
        )
        return False

    try:
        port = int(smtp_port)
    except ValueError:
        print("❌ Invalid SMTP_PORT")
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = email_from
    message["To"] = email_to
    message.set_content(body)

    try:
        with smtplib.SMTP(smtp_host, port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.send_message(message)

        print(f"📧 Email sent: {subject}")
        return True

    except Exception as error:
        print(f"❌ Email notification failed: {error}")
        return False


def handle_product_notification(
    result: ScrapeResult,
    state: dict,
) -> dict | None:
    product_state = get_product_state(state, result.product_id)

    if result.status == "success":
        product_state["last_suspicious_price"] = None

        if result.current_price is None:
            return None

        if result.current_price <= result.target_price:
            if product_state.get("target_alert_active", False):
                return None

            return {
                "type": "TARGET_REACHED",
                "product_id": result.product_id,
                "product": result.name,
                "current_price": result.current_price,
                "target_price": result.target_price,
                "currency": result.currency,
                "url": result.url,
            }

        product_state["target_alert_active"] = False
        return None

    if result.status == "suspicious":
        if result.current_price is None:
            return None

        if product_state.get("last_suspicious_price") == result.current_price:
            return None

        return {
            "type": "SUSPICIOUS_PRICE",
            "product_id": result.product_id,
            "product": result.name,
            "current_price": result.current_price,
            "previous_price": result.previous_price,
            "currency": result.currency,
            "url": result.url,
            "reason": result.error.message if result.error else None,
        }

    return None


def handle_run_notification(
    run_metadata: RunMetadata,
    state: dict,
) -> dict | None:
    if run_metadata.status != "failed":
        return None

    if state.get("last_failed_run_id") == run_metadata.run_id:
        return None

    return {
        "type": "RUN_FAILED",
        "run_id": run_metadata.run_id,
        "total_products": run_metadata.total_products,
        "successful": run_metadata.successful,
        "failed": run_metadata.failed,
        "suspicious": run_metadata.suspicious,
        "duration_seconds": run_metadata.duration_seconds,
    }


def send_summary_notification(events: list[dict]) -> bool:
    if not events:
        return False

    lines = []

    add_target_events(
        lines,
        [event for event in events if event.get("type") == "TARGET_REACHED"],
    )

    add_suspicious_events(
        lines,
        [event for event in events if event.get("type") == "SUSPICIOUS_PRICE"],
    )

    add_failed_run_events(
        lines,
        [event for event in events if event.get("type") == "RUN_FAILED"],
    )

    count = len(events)
    subject = f"Price Watch: {count} {'alert' if count == 1 else 'alerts'}"

    return send_email_notification(
        subject=subject,
        body="\n".join(lines),
    )


def mark_notification_events_sent(
    events: list[dict],
    state: dict,
) -> None:
    for event in events:
        event_type = event.get("type")

        if event_type == "TARGET_REACHED":
            product_state = get_product_state(
                state,
                event["product_id"],
            )
            product_state["target_alert_active"] = True

        elif event_type == "SUSPICIOUS_PRICE":
            product_state = get_product_state(
                state,
                event["product_id"],
            )
            product_state["last_suspicious_price"] = event["current_price"]

        elif event_type == "RUN_FAILED":
            state["last_failed_run_id"] = event["run_id"]


def get_product_state(state: dict, product_id: str) -> dict:
    return state.setdefault("products", {}).setdefault(
        product_id,
        {
            "target_alert_active": False,
            "last_suspicious_price": None,
        },
    )


def add_section(lines: list[str], title: str) -> None:
    if lines:
        lines.append("")

    lines.extend([title, "=" * 40])


def add_target_events(lines: list[str], events: list[dict]) -> None:
    if not events:
        return

    add_section(lines, "TARGET PRICES REACHED")

    for event in events:
        lines.extend([
            "",
            event["product"],
            f"Current: {event['current_price']:.2f} {event['currency']}",
            f"Target: {event['target_price']:.2f} {event['currency']}",
            event["url"],
        ])


def add_suspicious_events(lines: list[str], events: list[dict]) -> None:
    if not events:
        return

    add_section(lines, "SUSPICIOUS PRICES")

    for event in events:
        lines.extend([
            "",
            event["product"],
            f"Current: {event['current_price']:.2f} {event['currency']}",
        ])

        if event.get("previous_price") is not None:
            lines.append(
                f"Previous: {event['previous_price']:.2f} {event['currency']}"
            )

        if event.get("reason"):
            lines.append(f"Reason: {event['reason']}")

        lines.append(event["url"])


def add_failed_run_events(lines: list[str], events: list[dict]) -> None:
    if not events:
        return

    add_section(lines, "RUN FAILED")

    for event in events:
        lines.extend([
            "",
            f"Run ID: {event['run_id']}",
            f"Total products: {event['total_products']}",
            f"Successful: {event['successful']}",
            f"Failed: {event['failed']}",
            f"Suspicious: {event['suspicious']}",
            f"Duration: {event['duration_seconds']:.2f}s",
        ])