import asyncio
import sys
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo
from playwright.async_api import async_playwright
from pricewatch.models import (ScrapeError,ScrapeResult)
from pricewatch.scrapers.registry import get_scraper
from pricewatch.validation import (PriceValidationStatus,validate_price)
from pricewatch.history import get_previous_price
from pricewatch.debug import (get_debug_dir,save_debug_artifacts)
from pricewatch.run import build_run_metadata
from dotenv import load_dotenv
from pricewatch.notifications import (
    handle_product_notification,
    handle_run_notification,
    load_notification_state,
    mark_notification_events_sent,
    save_notification_state,
    send_summary_notification
)
from pricewatch.run_lock import (
    acquire_run_lock,
    release_run_lock,
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(
        encoding="utf-8",
        errors="replace",
    )

if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(
        encoding="utf-8",
        errors="replace",
    )

# ============================================================
# Paths
# ============================================================
# Local
PYTHON_DIR = Path(__file__).resolve().parent
PROJECT_DIR = PYTHON_DIR.parent
PRODUCTS_FILE = PYTHON_DIR / "products.json"
DATA_DIR = PROJECT_DIR / "data"
HISTORY_DIR = DATA_DIR / "history"
LATEST_FILE = DATA_DIR / "latest.json"
HISTORY_INDEX_FILE = HISTORY_DIR / "index.json"
DEBUG_DIR = PROJECT_DIR / "debug"
RUNS_DIR = DATA_DIR / "runs"
RUN_LATEST_FILE = RUNS_DIR / "latest.json"
ENV_FILE = PROJECT_DIR / ".env"
STATE_DIR = PYTHON_DIR / ".state"
NOTIFICATION_STATE_FILE = STATE_DIR / "notifications.json"

load_dotenv(ENV_FILE)

def get_product_sources(product):
    """
    Support:
    1. New format: sources
    2. Simple format: urls
    3. Old format: url
    """

    if product.get("sources"):
        return product["sources"]

    if product.get("urls"):
        return [
            {"url": url}
            for url in product["urls"]
        ]

    if product.get("url"):
        return [
            {"url": product["url"]}
        ]

    return []

# ============================================================
# Check one product
# ============================================================
async def check_product(page, product, period):

    # ============================================================
    # Product configuration
    # ============================================================

    name = product["name"]
    product_id = product.get("id", name)
    currency = product.get("currency", "SEK")
    target_price = float(product["target_price"])

    sources = get_product_sources(product)

    print("\n" + "=" * 70)
    print(f"Product: {name}")
    print(f"Target price: {target_price:.2f} {currency}")
    print(f"Sources: {len(sources)}")

    # No URLs configured
    if not sources:
        print("❌ No product URLs configured")

        return ScrapeResult(
            product_id=product_id,
            name=name,
            url="",
            target_price=target_price,
            status="failed",
            currency=currency,
            error=ScrapeError(
                type="NO_URL",
                message="No product URLs configured",
            ),
        )

    # ============================================================
    # Scrape every source
    # ============================================================

    offers = []
    errors = []

    for index, source in enumerate(sources, start=1):

        url = source["url"]
        store = source.get("store", f"Source {index}")

        print()
        print("-" * 70)
        print(f"Store: {store}")
        print(f"URL: {url}")

        # Create a temporary product config for this source.
        #
        # This is important because get_scraper() and individual
        # scraper adapters can continue using product["url"].
        source_product = {
            **product,
            **source,
            "url": url,
        }

        try:
            # Navigate to product page
            await page.goto(
                url,
                wait_until="commit",
                timeout=60000,
            )

            # Select scraper based on this source
            scraper = get_scraper(source_product)

            current_price = None

            # Give dynamic content time to load
            for attempt in range(4):

                current_price = await scraper.extract_price(
                    page,
                    source_product,
                )

                if current_price is not None:
                    break

                if attempt < 3:
                    await page.wait_for_timeout(1000)

            # Could not find price for this source
            if current_price is None:

                message = "Could not extract a product price"

                print(f"❌ {store}: {message}")

                errors.append(
                    f"{store}: {message}"
                )

                # Continue with next store
                continue

            print(
                f"✅ {store}: "
                f"{current_price:.2f} {currency}"
            )

            offers.append(
                {
                    "store": store,
                    "url": url,
                    "price": current_price,
                }
            )

        except Exception as e:

            print(
                f"❌ {store}: Failed to read page: {e}"
            )

            errors.append(
                f"{store}: {e}"
            )

            # One store failing should NOT fail the whole product.
            continue

    # ============================================================
    # No stores succeeded
    # ============================================================

    if not offers:

        print()
        print("❌ All sources failed")

        error_message = "; ".join(errors)

        # Use first URL so debug information still contains
        # a meaningful product URL.
        fallback_url = sources[0]["url"]

        return ScrapeResult(
            product_id=product_id,
            name=name,
            url=fallback_url,
            target_price=target_price,
            status="failed",
            currency=currency,
            error=ScrapeError(
                type="ALL_SOURCES_FAILED",
                message=(
                    error_message
                    or "Could not extract a price from any source"
                ),
            ),
        )

    # ============================================================
    # Pick cheapest successful offer
    # ============================================================

    best_offer = min(
        offers,
        key=lambda offer: offer["price"],
    )

    current_price = best_offer["price"]
    url = best_offer["url"]
    best_store = best_offer["store"]

    print()
    print("=" * 70)
    print(f"🏆 Cheapest store: {best_store}")
    print(f"🏆 Cheapest price: {current_price:.2f} {currency}")
    print(f"🏆 URL: {url}")

    if len(offers) < len(sources):
        print(
            f"⚠️ Successful sources: "
            f"{len(offers)}/{len(sources)}"
        )

    # ============================================================
    # Previous price
    # ============================================================

    previous_price = get_previous_price(
        history_dir=HISTORY_DIR,
        current_period=period,
        product_id=product_id,
    )

    if previous_price is None:
        print("Previous price: not available")
    else:
        print(
            f"Previous price: "
            f"{previous_price:.2f} {currency}"
        )

    # ============================================================
    # Validate cheapest current price
    # ============================================================

    validation = validate_price(
        price=current_price,
        previous_price=previous_price,
    )

    # ============================================================
    # Invalid
    # ============================================================

    if validation.status == PriceValidationStatus.INVALID:

        message = validation.message or "Invalid price"

        print(f"❌ {message}")

        return ScrapeResult(
            product_id=product_id,
            name=name,
            url=url,
            target_price=target_price,
            status="failed",
            current_price=current_price,
            previous_price=previous_price,
            currency=currency,
            error=ScrapeError(
                type="INVALID_PRICE",
                message=message,
            ),
        )

    # ============================================================
    # Suspicious
    # ============================================================

    if validation.status == PriceValidationStatus.SUSPICIOUS:

        message = (
            validation.message
            or "Suspicious price"
        )

        print(
            f"⚠️ Suspicious price: "
            f"{current_price:.2f} {currency}"
        )

        if validation.change_ratio is not None:

            percentage = (
                validation.change_ratio * 100
            )

            print(
                f"⚠️ Price change: "
                f"{percentage:.1f}%"
            )

        print(f"⚠️ Reason: {message}")

        return ScrapeResult(
            product_id=product_id,
            name=name,
            url=url,
            target_price=target_price,
            status="suspicious",
            current_price=current_price,
            previous_price=previous_price,
            currency=currency,
            error=ScrapeError(
                type="SUSPICIOUS_PRICE",
                message=message,
            ),
        )

    # ============================================================
    # Valid price
    # ============================================================

    below_target = (
        current_price <= target_price
    )

    difference = (
        current_price - target_price
    )

    if below_target:

        print(
            f"🟢 Current price: "
            f"{current_price:.2f} {currency}"
        )

        print(
            f"🎯 Below target price: "
            f"{abs(difference):.2f} {currency}"
        )

    else:

        print(
            f"⚪ Current price: "
            f"{current_price:.2f} {currency}"
        )

        print(
            f"Still needs to drop by: "
            f"{difference:.2f} {currency}"
        )

    # ============================================================
    # Successful product result
    # ============================================================

    return ScrapeResult(
        product_id=product_id,
        name=name,

        # 最低价商店
        url=url,
        store=best_store,

        target_price=target_price,
        status="success",

        current_price=current_price,
        previous_price=previous_price,

        below_target=below_target,
        difference=round(difference, 2),

        currency=currency,

        # 所有商店报价
        offers=offers,
    )

# ============================================================
# Save JSON
# ============================================================
def save_json(
    file_path: Path,
    data,
) -> None:
    file_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    temp_file = (
        file_path.with_suffix(
            file_path.suffix + ".tmp"
        )
    )

    try:
        with temp_file.open(
            "w",
            encoding="utf-8",
            newline="\n",
        ) as f:
            json.dump(
                data,
                f,
                ensure_ascii=False,
                indent=2,
            )

            f.write("\n")
            f.flush()

            os.fsync(
                f.fileno()
            )

        os.replace(
            temp_file,
            file_path,
        )

    finally:
        temp_file.unlink(
            missing_ok=True
        )

# ============================================================
# Update history index
# ============================================================
def update_history_index(period):
    periods = []

    #Find index.json in public\data
    if HISTORY_INDEX_FILE.exists():
        try:
            with open(HISTORY_INDEX_FILE, "r", encoding="utf-8") as f:
                old_data = json.load(f)
                periods = old_data.get("periods",[])
        except Exception:
            periods = []

    if period not in periods:
        periods.append(period)

    # Keep newest dates first
    periods.sort(reverse=True)

    data = {"periods": periods}
    save_json(HISTORY_INDEX_FILE,data)

# ============================================================
# Main program
# ============================================================
async def main():
    #if products.json exists
    if not PRODUCTS_FILE.exists():
        print(f"File not found: {PRODUCTS_FILE}")
        return

    # Read products.json
    with open(PRODUCTS_FILE,"r", encoding="utf-8-sig",) as f:
        products = json.load(f)

    # Load notification state
    notification_state = load_notification_state(NOTIFICATION_STATE_FILE)
    notification_events = []

    # Date and time
    stockholm = ZoneInfo("Europe/Stockholm")
    started_at = datetime.now(stockholm)
    monday = (started_at - timedelta(days=started_at.weekday())).date()
    period = monday.isoformat()
    generated_at = started_at.isoformat()
    run_id = started_at.strftime("%Y-%m-%d_%H-%M-%S")

    print("\n")
    print("=" * 70)
    print("Price check started")
    print(f"Period: {period}")
    print(f"Time: {generated_at}")
    print("=" * 70)

    results = []
    successful_count = 0
    failed_count = 0
    suspicious_count = 0

    # Playwright
    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)

        context = await browser.new_context(
            locale="sv-SE",
            timezone_id="Europe/Stockholm",
            viewport={"width": 1440, "height": 1000}
        )

        page = await context.new_page()

        # Start tracing
        await context.tracing.start(
            screenshots=True,
            snapshots=True,
            sources=True
        )

        # Check all products
        for product in products:
            product_id = product.get("id", product["name"])

            await context.tracing.start_chunk(
                title=(f"Price check: {product['name']}")
            )

            result = await check_product(page, product, period)

            # Success, Suspicious or Failed
            if result.status == "success":
                successful_count += 1
                results.append(result.model_dump(mode="json"))
                await context.tracing.stop_chunk()
            else:
                debug_dir = get_debug_dir(
                    debug_root=DEBUG_DIR,
                    run_id=run_id,
                    product_id=product_id,
                )

                await save_debug_artifacts(
                    page=page,
                    debug_dir=debug_dir,
                    result=result,
                )

                await context.tracing.stop_chunk(
                    path = debug_dir / "trace.zip"
                )

                if result.status == "suspicious":
                    suspicious_count += 1
                    print(f"⚠️ Suspicious result was NOT added to history: {result.name}")
                elif result.status == "failed":
                    failed_count += 1
                    print(f"❌ Scrape failed: {result.name}")
                else:
                    print(f"❓ Unknown result status ({result.status}): {result.name}")

                print(f"🐞 Debug artifacts: {debug_dir}")

            # ============================================================
            # Collect notification event
            # ============================================================

            event = handle_product_notification(
                result,
                notification_state,
            )

            if event is not None:

                notification_events.append(
                    event
                )

            await asyncio.sleep(2)

        # Stop tracing and build run metadata
        finished_at = datetime.now(stockholm)

        run_metadata = build_run_metadata(
            run_id=run_id,
            started_at=started_at,
            finished_at=finished_at,
            total_products=len(products),
            successful=successful_count,
            failed=failed_count,
            suspicious=suspicious_count
        )

        # Save run metadata to runs directory
        run_file = RUNS_DIR / f"{run_id}.json"
        save_json(run_file, run_metadata.model_dump(mode="json"))

        # Latest scraper health snapshot
        save_json(RUN_LATEST_FILE,run_metadata.model_dump(mode="json"))
    
        # ============================================================
        # Collect run notification
        # ============================================================

        run_event = handle_run_notification(
            run_metadata,
            notification_state,
        )

        if run_event is not None:
            notification_events.append(
                run_event
            )

        # ============================================================
        # Send ONE summary notification
        # ============================================================
        if notification_events:
            sent = send_summary_notification(notification_events)

            if sent:
                mark_notification_events_sent(
                    notification_events,
                    notification_state,
                )

        # Save state even if there was no email.
        # This also preserves reset / re-arm changes.
        save_notification_state(
            NOTIFICATION_STATE_FILE,
            notification_state
        )
            
        if not results:
            print(
                "❌ No product prices were collected."
            )

            print(
                "Existing local price data "
                "will NOT be overwritten."
            )

            return

        await context.tracing.stop()
        await browser.close()

    # Build final output data
    output = {
        "period": period,
        "generated_at": generated_at,
        "data": results
    }

    # Save history JSON locally
    history_file = HISTORY_DIR / f"{period}.json"
    save_json(history_file, output)

    # Update local history/index.json
    update_history_index(period)

    # Save latest.json locally
    save_json(LATEST_FILE, output)

    # Upload history/index.json
    with open(HISTORY_INDEX_FILE, "r", encoding="utf-8") as f:
        history_index = json.load(f)

    # Print summary
    print("\n")
    print("=" * 70)
    print("Run completed")
    print("=" * 70)
    print(f"Status: {run_metadata.status.upper()}")
    print(f"Successful: {run_metadata.successful}")
    print(f"Suspicious: {run_metadata.suspicious}") 
    print(f"Failed: {run_metadata.failed}")
    print(f"Total: {run_metadata.total_products}")
    print(f"Duration: {run_metadata.duration_seconds:.2f}s")
    print(f"Run metadata: {run_file}")
    print(f"Latest data: {LATEST_FILE}")
    print(f"History data: {history_file}")
    print(f"History index: {HISTORY_INDEX_FILE}")

if __name__ == "__main__":

    if not acquire_run_lock():

        print(
            "⚠️ Another Price Watch "
            "scraper process is already running."
        )

        raise SystemExit(
            2
        )

    try:

        asyncio.run(
            main()
        )

    finally:

        release_run_lock()