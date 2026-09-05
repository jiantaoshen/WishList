# ============================================================
# Code for testing email notifications from Price Watch
# ============================================================
from pathlib import Path

from dotenv import load_dotenv

from backend.python.pricewatch.notifications import (
    send_email_notification,
)

PYTHON_DIR = Path(__file__).resolve().parent
PROJECT_DIR = PYTHON_DIR.parent

load_dotenv(PROJECT_DIR / ".env")

success = send_email_notification(
    subject="Price Watch Test",
    body=("This is a test email from Price Watch.")
)

print(
    f"Success: {success}"
)

raise SystemExit(
    0 if success else 1
)