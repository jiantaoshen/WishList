import json
import re
from pathlib import Path

from pricewatch.models import ScrapeResult


def sanitize_filename(
    value: str,
) -> str:
    """
    Convert a product ID/name into a Windows-safe
    directory name.
    """

    cleaned = re.sub(
        r'[<>:"/\\|?*\x00-\x1F]+',
        "_",
        value,
    )

    cleaned = cleaned.strip(
        " ."
    )

    if not cleaned:
        return "unknown-product"

    return cleaned


def get_debug_dir(
    debug_root: Path,
    run_id: str,
    product_id: str,
) -> Path:
    """
    Build the debug directory for one product.
    """

    safe_product_id = (
        sanitize_filename(
            product_id
        )
    )

    debug_dir = (
        debug_root
        / run_id
        / safe_product_id
    )

    debug_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    return debug_dir


async def save_debug_artifacts(
    page,
    debug_dir: Path,
    result: ScrapeResult,
) -> None:
    """
    Save diagnostic files for a failed or
    suspicious scraping result.
    """

    artifact_errors = []

    # =========================================================
    # Screenshot
    # =========================================================

    try:

        await page.screenshot(
            path=(
                debug_dir
                / "screenshot.png"
            ),
            full_page=True,
        )

    except Exception as e:

        artifact_errors.append(
            {
                "artifact": "screenshot",
                "error": str(e),
            }
        )

    # =========================================================
    # HTML
    # =========================================================

    try:

        html = await page.content()

        (
            debug_dir
            / "page.html"
        ).write_text(
            html,
            encoding="utf-8",
        )

    except Exception as e:

        artifact_errors.append(
            {
                "artifact": "html",
                "error": str(e),
            }
        )

    # =========================================================
    # Error metadata
    # =========================================================

    debug_data = {
        "result": result.model_dump(
            mode="json"
        ),
        "page_url": page.url,
        "artifact_errors": (
            artifact_errors
        ),
    }

    (
        debug_dir
        / "error.json"
    ).write_text(
        json.dumps(
            debug_data,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )