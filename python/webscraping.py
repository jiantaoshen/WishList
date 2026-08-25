import asyncio
import json
from datetime import datetime, timedelta
from pathlib import Path
from unittest import result
from zoneinfo import ZoneInfo
from playwright.async_api import async_playwright
from google.cloud import storage
from google.api_core.exceptions import (NotFound, PreconditionFailed)
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

# ============================================================
# Paths
# ============================================================
# Local
PYTHON_DIR = Path(__file__).resolve().parent
PROJECT_DIR = PYTHON_DIR.parent
PRODUCTS_FILE = PYTHON_DIR / "products.json"
DATA_DIR = PROJECT_DIR / "public" / "data"
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

# Google Cloud Storage
BUCKET_NAME = "wishlist-example-price-data"

# ============================================================
# Check one product
# ============================================================
async def check_product(page,product,period):

    # Get product data from products.json
    name = product["name"]
    url = product["url"]
    product_id = product.get("id", name)
    currency = product.get("currency","SEK")
    target_price = float(product["target_price"])

    print("\n" + "=" * 70)
    print(f"Product: {name}")
    print(f"URL: {url}")
    print(f"Target price: {target_price:.2f} {currency}")

    # Get product's price from the page
    try:
        # Navigate to product page and wait up to 1 minute for the navigation to start.
        await page.goto(url, wait_until="commit", timeout=60000)

        # Select scraper adapter
        scraper = get_scraper(product)

        # Give dynamic content up to 3 seconds to load and extract periodically for a price.
        current_price = None

        for attempt in range(4):
            current_price = await scraper.extract_price(page, product)

            if current_price is not None:
                break

            if attempt < 3:
                await page.wait_for_timeout(1000)

        # No price extracted
        if current_price is None:
            print("❌ Could not read the current price")

            return ScrapeResult(
                product_id=product_id,
                name=name,
                url=url,
                target_price=target_price,
                status="failed",
                currency=currency,
                error=ScrapeError(
                    type="PRICE_NOT_FOUND",
                    message=("Could not extract a product price")
                )
            )

        # Find previous price if any
        previous_price = (
            get_previous_price(
                history_dir=HISTORY_DIR,
                current_period=period,
                product_id=product_id
            )
        )

        if previous_price is None:
            print("Previous price: not available")
        else:
            print(f"Previous price: {previous_price:.2f} {currency}")

        # Validate current price
        validation = validate_price(
            price=current_price,
            previous_price=previous_price,
        )

        # Invalid price
        if (validation.status == PriceValidationStatus.INVALID):
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
        
        # Suspicious price
        if (validation.status == PriceValidationStatus.SUSPICIOUS):
            message = validation.message or "Suspicious price"
            print(f"⚠️ Suspicious price: {current_price:.2f} {currency}")

            if (validation.change_ratio is not None):
                percentage = validation.change_ratio * 100
                print( f"⚠️ Price change: {percentage:.1f}%")

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

        # Valid price
        below_target = current_price <= target_price

        difference = current_price - target_price

        if below_target:
            print(f"🟢 Current price: {current_price:.2f} {currency}")
            print(f"🎯 Below target price: {abs(difference):.2f} {currency}")

        else:
            print(f"⚪ Current price: {current_price:.2f} {currency}")
            print(f"Still needs to drop by: {difference:.2f} {currency}")

        # Successful result
        return ScrapeResult(
            product_id=product_id,
            name=name,
            url=url,
            target_price=target_price,
            status="success",
            current_price=current_price,
            previous_price=previous_price,
            below_target=below_target,
            difference=round(difference, 2),
            currency=currency
        )
    
    except Exception as e:
        print(f"❌ Failed to read page: {e}")

        return ScrapeResult(
            product_id=product_id,
            name=name,
            url=url,
            target_price=target_price,
            status="failed",
            currency=currency,
            error=ScrapeError(
                type="PAGE_CHECK_FAILED",
                message=str(e),
            )
        )

# ============================================================
# Save JSON
# ============================================================
def save_json(file_path, data):
    file_path.parent.mkdir(parents=True,exist_ok=True)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2
        )

# ============================================================
#  Upload a new immutable JSON object.
# 
#  The upload fails if an object with the same name already exists.
# ============================================================
def upload_new_json_to_gcs(blob_name, data):
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(blob_name)
    json_text = json.dumps(data, ensure_ascii=False,indent=2)
    blob.upload_from_string(
        json_text, 
        content_type="application/json",
        if_generation_match = 0 # Only create if no live object exists.
        )
    print(f"☁️ Created: gs://{BUCKET_NAME}/{blob_name}")

# ============================================================
#  Safely update a JSON object using 
#  a Cloud Storage generation precondition
# ============================================================
def upload_json_to_gcs_safely(blob_name,data):
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(blob_name)

    json_text = json.dumps(data,ensure_ascii=False,indent=2)
    try:
        # Read the current object generation.
        blob.reload()

        current_generation = (blob.generation)

        blob.upload_from_string(
            json_text,
            content_type ="application/json",
            if_generation_match = current_generation
        )

    except NotFound:
        # Object does not exist yet.
        blob.upload_from_string(
            json_text,
            content_type="application/json",
            if_generation_match=0,
        )

    except PreconditionFailed:
        raise RuntimeError(f"GCS object changed while updating: {blob_name}")

    print(f"☁️ Safe upload: gs://{BUCKET_NAME}/{blob_name}")

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
    with open(PRODUCTS_FILE,"r",encoding="utf-8",) as f:
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
    
        # Upload run metadata to Google Cloud Storage
        upload_new_json_to_gcs(f"runs/{run_id}.json", run_metadata.model_dump(mode="json"))

        # Update latest run metadata in Google Cloud Storage
        upload_json_to_gcs_safely("runs/latest.json", run_metadata.model_dump(mode="json"))

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
            print("❌ No product prices were collected.")
            print("Existing Cloud Storage data will NOT be overwritten.")
            raise RuntimeError("Price check failed: no products collected")

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

    # Upload this week's history JSON
    upload_json_to_gcs_safely(f"history/{period}.json",output)

    # Upload history/index.json
    with open(HISTORY_INDEX_FILE, "r", encoding="utf-8") as f:
        history_index = json.load(f)

    # Update history/index.json to Google Cloud Storage
    upload_json_to_gcs_safely("history/index.json", history_index)

    # Update latest.json in Google Cloud Storage
    upload_json_to_gcs_safely("latest.json",output)

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
    asyncio.run(main())