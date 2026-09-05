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
from pricewatch.history import (
    get_previous_price,
    get_previous_unit_price,
)
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


# ============================================================
# Scraping mode helpers
# ============================================================
def should_scrape_source(
    product,
    source,
) -> bool:
    return (
        product.get(
            "scraping_enabled",
            True,
        )
        and
        source.get(
            "scraping_enabled",
            True,
        )
    )


async def get_source_price(
    page,
    product,
    source,
) -> tuple[
    float | None,
    str,
]:
    """
    Returns:
        (price, price_source)

    price_source:
        "scrape"
        "manual"
    """

    should_scrape = (
        should_scrape_source(
            product,
            source,
        )
    )

    # ========================================================
    # Manual
    # ========================================================
    if not should_scrape:
        manual_price = source.get(
            "manual_price"
        )

        if manual_price is None:
            return None, "manual"

        try:
            price = float(
                manual_price
            )
        except (
            TypeError,
            ValueError,
        ):
            return None, "manual"

        if price <= 0:
            return None, "manual"

        return price, "manual"

    # ========================================================
    # Scrape
    # ========================================================
    url = source["url"]

    source_product = {
        **product,
        **source,
        "url": url,
    }

    await page.goto(
        url,
        wait_until="domcontentloaded",
        timeout=60000,
    )

    scraper = get_scraper(
        source_product
    )

    current_price = None

    for attempt in range(4):
        current_price = (
            await scraper.extract_price(
                page,
                source_product,
            )
        )

        if current_price is not None:
            break

        if attempt < 3:
            await page.wait_for_timeout(
                1000
            )

    if current_price is None:
        return None, "scrape"

    return (
        float(current_price),
        "scrape",
    )


# ============================================================
# Product source compatibility
# ============================================================
def get_product_sources(product):
    # New format
    if product.get("sources"):
        return product["sources"]

    # Multiple URL compatibility
    if product.get("urls"):
        return [
            {
                "store": f"Source {index + 1}",
                "url": url,
                "scraping_enabled": True,
                "manual_price": None,
                "unit_quantity": None,
                "note": None,
            }
            for index, url in enumerate(
                product["urls"]
            )
        ]

    # Old single URL compatibility
    if product.get("url"):
        return [
            {
                "store": "Source",
                "url": product["url"],
                "scraping_enabled": True,
                "manual_price": None,
                "unit_quantity": None,
                "note": None,
            }
        ]

    return []


def product_uses_scraper(
    product,
) -> bool:
    sources = get_product_sources(
        product
    )

    return any(
        should_scrape_source(
            product,
            source,
        )
        for source in sources
    )

# ============================================================
# Check one product
# ============================================================
async def check_product(
    page,
    product,
    period,
):

    # ============================================================
    # Product configuration
    # ============================================================

    name = product["name"]

    product_id = product.get(
        "id",
        name,
    )

    currency = product.get(
        "currency",
        "SEK",
    )

    target_price = float(
        product["target_price"]
    )

    unit = product.get("unit")

    # Comparison quantity defines the normalized total-price basis.
    # Example: comparison_quantity = 2 means every store is compared
    # as the price for 2 units, regardless of package size.
    comparison_quantity_raw = product.get(
        "comparison_quantity"
    )

    comparison_quantity = None

    if comparison_quantity_raw is not None:
        try:
            parsed_comparison_quantity = float(
                comparison_quantity_raw
            )

            if parsed_comparison_quantity > 0:
                comparison_quantity = (
                    parsed_comparison_quantity
                )
            else:
                raise ValueError(
                    "comparison_quantity must be greater than 0"
                )

        except (
            TypeError,
            ValueError,
        ) as error:
            return ScrapeResult(
                product_id=product_id,
                name=name,
                url="",
                target_price=target_price,
                unit=unit,
                status="failed",
                currency=currency,
                error=ScrapeError(
                    type="INVALID_COMPARISON_QUANTITY",
                    message=str(error),
                ),
            )

    target_unit_price_raw = product.get(
        "target_unit_price"
    )

    target_unit_price = (
        float(target_unit_price_raw)
        if target_unit_price_raw is not None
        else None
    )

    sources = get_product_sources(
        product
    )


    print("\n" + "=" * 70)

    print(f"Product: {name}")

    if comparison_quantity is not None:
        print(
            f"Comparison quantity: "
            f"{comparison_quantity:g}"
            + (
                f" {unit}"
                if unit
                else " units"
            )
        )

        print(
            f"Target comparable total: "
            f"{target_price:.2f} {currency}"
        )
    else:
        print(
            f"Target total price: "
            f"{target_price:.2f} {currency}"
        )

    if target_unit_price is not None:

        print(
            f"Target unit price: "
            f"{target_unit_price:.4f} "
            f"{currency}"
            + (
                f"/{unit}"
                if unit
                else ""
            )
        )

    print(
        f"Sources: {len(sources)}"
    )


    # ============================================================
    # No sources
    # ============================================================

    if not sources:

        print(
            "❌ No product URLs configured"
        )

        return ScrapeResult(
            product_id=product_id,
            name=name,
            url="",
            target_price=target_price,
            target_unit_price=target_unit_price,
            unit=unit,
            status="failed",
            currency=currency,
            error=ScrapeError(
                type="NO_URL",
                message=(
                    "No product URLs configured"
                ),
            ),
        )


    # ============================================================
    # Check all sources
    # ============================================================

    offers = []
    errors = []

    for index, source in enumerate(
        sources,
        start=1,
    ):
        url = source["url"]

        store = source.get(
            "store"
        ) or f"Source {index}"

        note = source.get("note")

        # --------------------------------------------------------
        # Unit quantity
        # --------------------------------------------------------
        unit_quantity = None

        raw_unit_quantity = source.get(
            "unit_quantity"
        )

        if raw_unit_quantity is not None:
            try:
                parsed_quantity = float(
                    raw_unit_quantity
                )

                if parsed_quantity > 0:
                    unit_quantity = (
                        parsed_quantity
                    )

            except (
                TypeError,
                ValueError,
            ):
                unit_quantity = None

        is_scraping = (
            should_scrape_source(
                product,
                source,
            )
        )

        print()
        print("-" * 70)
        print(f"Store: {store}")
        print(f"URL: {url}")
        print(
            "Mode: "
            + (
                "scraper"
                if is_scraping
                else "manual"
            )
        )

        if unit_quantity is not None:
            print(
                f"Unit quantity: "
                f"{unit_quantity:g}"
                + (
                    f" {unit}"
                    if unit
                    else ""
                )
            )

        if note:
            print(f"Note: {note}")

        try:
            (
                current_price,
                price_source,
            ) = await get_source_price(
                page,
                product,
                source,
            )

            # ====================================================
            # No price
            # ====================================================
            if current_price is None:
                message = (
                    "Could not extract "
                    "a product price"
                    if is_scraping
                    else
                    "Manual price is missing "
                    "or invalid"
                )

                print(
                    f"❌ {store}: {message}"
                )

                errors.append(
                    f"{store}: {message}"
                )

                continue

            # ====================================================
            # Unit price
            # ====================================================
            unit_price = None

            if unit_quantity is not None:
                unit_price = round(
                    current_price /
                    unit_quantity,
                    4,
                )

            # ====================================================
            # Comparable total price
            # ====================================================
            # Keep the website/package price in `price`.
            # `comparison_price` is the normalized price used only
            # when the product has comparison_quantity configured.
            comparison_price = None

            if (
                comparison_quantity is not None
                and
                unit_price is not None
            ):
                comparison_price = round(
                    unit_price *
                    comparison_quantity,
                    2,
                )

            print(
                f"✅ {store}: "
                f"{current_price:.2f} "
                f"{currency}"
            )

            print(
                f"   Source: "
                f"{price_source}"
            )

            if unit_price is not None:
                print(
                    f"   Unit price: "
                    f"{unit_price:.4f} "
                    f"{currency}"
                    + (
                        f"/{unit}"
                        if unit
                        else ""
                    )
                )

            if comparison_quantity is not None:
                if comparison_price is not None:
                    print(
                        f"   Price for "
                        f"{comparison_quantity:g}"
                        + (
                            f" {unit}: "
                            if unit
                            else " units: "
                        )
                        + f"{comparison_price:.2f} "
                        + f"{currency}"
                    )
                else:
                    print(
                        "   ⚠️ Not eligible for "
                        "total-price comparison: "
                        "unit quantity is missing."
                    )

            # ====================================================
            # Save offer
            # ====================================================
            offers.append(
                {
                    "store": store,
                    "url": url,

                    # Actual website/package price.
                    "price": current_price,

                    "price_source": price_source,

                    "unit_quantity": (
                        unit_quantity
                    ),

                    "unit_price": unit_price,

                    # Normalized total price.
                    "comparison_price": (
                        comparison_price
                    ),

                    "note": note,
                }
            )

        except Exception as e:
            print(
                f"❌ {store}: {e}"
            )

            errors.append(
                f"{store}: {e}"
            )

            continue


    # ============================================================
    # No successful source
    # ============================================================

    if not offers:

        print()

        print(
            "❌ All sources failed"
        )

        error_message = "; ".join(
            errors
        )

        fallback_url = (
            sources[0]["url"]
        )

        return ScrapeResult(
            product_id=product_id,
            name=name,
            url=fallback_url,
            target_price=target_price,
            target_unit_price=target_unit_price,
            unit=unit,
            status="failed",
            currency=currency,
            offers=[],
            error=ScrapeError(
                type="ALL_SOURCES_FAILED",
                message=(
                    error_message
                    or
                    "Could not extract "
                    "a price from any source"
                ),
            ),
        )


    # ============================================================
    # Cheapest total / comparable total
    # ============================================================

    if comparison_quantity is not None:
        comparable_offers = [
            offer
            for offer in offers
            if offer["comparison_price"] is not None
        ]

        # When normalized comparison is enabled, a source without
        # unit_quantity must never fall back to its raw package price.
        if not comparable_offers:
            print()
            print(
                "❌ Comparison quantity is enabled, "
                "but no source has a valid unit quantity."
            )

            fallback_url = (
                offers[0]["url"]
                if offers
                else sources[0]["url"]
            )

            return ScrapeResult(
                product_id=product_id,
                name=name,
                url=fallback_url,
                target_price=target_price,
                target_unit_price=target_unit_price,
                unit=unit,
                status="failed",
                currency=currency,
                offers=offers,
                error=ScrapeError(
                    type="NO_COMPARABLE_OFFERS",
                    message=(
                        "Comparison quantity is enabled, "
                        "but no source has a valid unit quantity."
                    ),
                ),
            )

        best_offer = min(
            comparable_offers,
            key=lambda offer:
                offer["comparison_price"],
        )

        # IMPORTANT:
        # Product-level current_price, target checks and history now use
        # the normalized comparable total, not the raw package price.
        current_price = float(
            best_offer["comparison_price"]
        )

    else:
        best_offer = min(
            offers,
            key=lambda offer:
                offer["price"],
        )

        current_price = float(
            best_offer["price"]
        )

    url = best_offer["url"]
    best_store = best_offer["store"]

    # Actual package price remains available inside the winning offer.
    best_actual_price = float(
        best_offer["price"]
    )


    # ============================================================
    # Cheapest unit price
    # ============================================================

    unit_offers = [
        offer
        for offer in offers
        if offer["unit_price"] is not None
    ]


    best_unit_offer = None

    current_unit_price = None

    unit_store = None

    unit_url = None


    if unit_offers:

        best_unit_offer = min(
            unit_offers,
            key=lambda offer:
                offer["unit_price"],
        )

        current_unit_price = float(
            best_unit_offer[
                "unit_price"
            ]
        )

        unit_store = (
            best_unit_offer["store"]
        )

        unit_url = (
            best_unit_offer["url"]
        )


    # ============================================================
    # Print winners
    # ============================================================

    print()

    print("=" * 70)

    if comparison_quantity is not None:
        print(
            f"🏆 Cheapest comparable total: "
            f"{best_store}"
        )

        print(
            f"🏆 Actual package price: "
            f"{best_actual_price:.2f} "
            f"{currency}"
        )

        print(
            f"🏆 Price for "
            f"{comparison_quantity:g}"
            + (
                f" {unit}: "
                if unit
                else " units: "
            )
            + f"{current_price:.2f} "
            + f"{currency}"
        )
    else:
        print(
            f"🏆 Cheapest total: "
            f"{best_store}"
        )

        print(
            f"🏆 Total price: "
            f"{current_price:.2f} "
            f"{currency}"
        )


    if current_unit_price is not None:

        print(
            f"🏆 Cheapest unit: "
            f"{unit_store}"
        )

        print(
            f"🏆 Unit price: "
            f"{current_unit_price:.4f} "
            f"{currency}"
            + (
                f"/{unit}"
                if unit
                else ""
            )
        )


    if len(offers) < len(sources):

        print(
            f"⚠️ Successful sources: "
            f"{len(offers)}/"
            f"{len(sources)}"
        )


    # ============================================================
    # Previous prices
    # ============================================================

    previous_price = (
        get_previous_price(
            history_dir=HISTORY_DIR,
            current_period=period,
            product_id=product_id,
        )
    )


    previous_unit_price = (
        get_previous_unit_price(
            history_dir=HISTORY_DIR,
            current_period=period,
            product_id=product_id,
        )
    )


    if previous_price is None:

        print(
            "Previous total price: "
            "not available"
        )

    else:

        print(
            f"Previous total price: "
            f"{previous_price:.2f} "
            f"{currency}"
        )


    if previous_unit_price is not None:

        print(
            f"Previous unit price: "
            f"{previous_unit_price:.4f} "
            f"{currency}"
            + (
                f"/{unit}"
                if unit
                else ""
            )
        )


    # ============================================================
    # Validate total price
    # ============================================================

    validation = validate_price(
        price=current_price,
        previous_price=previous_price,
    )


    # ============================================================
    # Invalid
    # ============================================================

    if (
        validation.status ==
        PriceValidationStatus.INVALID
    ):

        message = (
            validation.message
            or "Invalid price"
        )

        print(
            f"❌ {message}"
        )

        return ScrapeResult(
            product_id=product_id,
            name=name,

            url=url,
            store=best_store,

            target_price=target_price,

            current_price=current_price,
            previous_price=previous_price,

            unit=unit,
            unit_url=unit_url,
            unit_store=unit_store,

            target_unit_price=(
                target_unit_price
            ),

            current_unit_price=(
                current_unit_price
            ),

            previous_unit_price=(
                previous_unit_price
            ),

            status="failed",
            currency=currency,
            offers=offers,

            error=ScrapeError(
                type="INVALID_PRICE",
                message=message,
            ),
        )


    # ============================================================
    # Suspicious
    # ============================================================

    if (
        validation.status ==
        PriceValidationStatus.SUSPICIOUS
    ):

        message = (
            validation.message
            or "Suspicious price"
        )

        print(
            f"⚠️ Suspicious price: "
            f"{current_price:.2f} "
            f"{currency}"
        )


        if (
            validation.change_ratio
            is not None
        ):

            percentage = (
                validation.change_ratio *
                100
            )

            print(
                f"⚠️ Price change: "
                f"{percentage:.1f}%"
            )


        print(
            f"⚠️ Reason: {message}"
        )


        return ScrapeResult(
            product_id=product_id,
            name=name,

            url=url,
            store=best_store,

            target_price=target_price,

            current_price=current_price,
            previous_price=previous_price,

            unit=unit,
            unit_url=unit_url,
            unit_store=unit_store,

            target_unit_price=(
                target_unit_price
            ),

            current_unit_price=(
                current_unit_price
            ),

            previous_unit_price=(
                previous_unit_price
            ),

            status="suspicious",
            currency=currency,
            offers=offers,

            error=ScrapeError(
                type="SUSPICIOUS_PRICE",
                message=message,
            ),
        )


    # ============================================================
    # Total target
    # ============================================================

    below_target = (
        current_price <=
        target_price
    )

    difference = round(
        current_price -
        target_price,
        2,
    )


    # ============================================================
    # Unit target
    # ============================================================

    unit_below_target = None

    unit_difference = None


    if (
        current_unit_price is not None
        and
        target_unit_price is not None
    ):

        unit_below_target = (
            current_unit_price <=
            target_unit_price
        )

        unit_difference = round(
            current_unit_price -
            target_unit_price,
            4,
        )


    # ============================================================
    # Print total status
    # ============================================================

    total_label = (
        "comparable total"
        if comparison_quantity is not None
        else "total"
    )

    if below_target:

        print(
            f"🟢 Current {total_label}: "
            f"{current_price:.2f} "
            f"{currency}"
        )

        print(
            f"🎯 Below {total_label} target: "
            f"{abs(difference):.2f} "
            f"{currency}"
        )

    else:

        print(
            f"⚪ Current {total_label}: "
            f"{current_price:.2f} "
            f"{currency}"
        )

        print(
            f"{total_label.capitalize()} needs "
            f"to drop by: "
            f"{difference:.2f} "
            f"{currency}"
        )


    # ============================================================
    # Print unit status
    # ============================================================

    if (
        current_unit_price is not None
        and
        target_unit_price is not None
    ):

        if unit_below_target:

            print(
                f"🟢 Unit price below target: "
                f"{abs(unit_difference):.4f} "
                f"{currency}"
                + (
                    f"/{unit}"
                    if unit
                    else ""
                )
            )

        else:

            print(
                f"⚪ Unit price needs "
                f"to drop by: "
                f"{unit_difference:.4f} "
                f"{currency}"
                + (
                    f"/{unit}"
                    if unit
                    else ""
                )
            )


    # ============================================================
    # Success
    # ============================================================

    return ScrapeResult(
        product_id=product_id,
        name=name,

        # Total price winner
        url=url,
        store=best_store,

        target_price=target_price,

        current_price=current_price,
        previous_price=previous_price,

        below_target=below_target,
        difference=difference,

        # Unit price winner
        unit=unit,

        unit_url=unit_url,
        unit_store=unit_store,

        target_unit_price=(
            target_unit_price
        ),

        current_unit_price=(
            current_unit_price
        ),

        previous_unit_price=(
            previous_unit_price
        ),

        unit_below_target=(
            unit_below_target
        ),

        unit_difference=(
            unit_difference
        ),

        status="success",
        currency=currency,

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

            # Only pause after products that actually use scraping.
            if product_uses_scraper(
                product
            ):
                await asyncio.sleep(
                    2
                )

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
