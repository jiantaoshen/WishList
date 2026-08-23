import asyncio
import json
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from playwright.async_api import async_playwright

from google.cloud import storage

# ============================================================
# Paths
# ============================================================

PYTHON_DIR = Path(__file__).resolve().parent
PROJECT_DIR = PYTHON_DIR.parent

PRODUCTS_FILE = PYTHON_DIR / "products.json"

DATA_DIR = PROJECT_DIR / "public" / "data"
HISTORY_DIR = DATA_DIR / "history"

LATEST_FILE = DATA_DIR / "latest.json"
HISTORY_INDEX_FILE = HISTORY_DIR / "index.json"

# Google Cloud Storage
BUCKET_NAME = "wishlist-example-price-data"

# ============================================================
# Find Product objects in JSON-LD
# ============================================================

def find_product_objects(data):
    """
    Recursively find Product objects in JSON-LD.
    Supports:
    - Product
    - @graph
    - list
    """

    results = []

    if isinstance(data, list):

        for item in data:
            results.extend(
                find_product_objects(item)
            )

    elif isinstance(data, dict):

        item_type = data.get("@type")

        if item_type == "Product":
            results.append(data)

        elif isinstance(item_type, list):

            if "Product" in item_type:
                results.append(data)

        if "@graph" in data:

            results.extend(
                find_product_objects(
                    data["@graph"]
                )
            )

    return results


# ============================================================
# Read the current price from product JSON-LD
# ============================================================

async def extract_product_price(
    page,
    product_name,
    product_url,
):

    try:

        scripts = await page.locator(
            'script[type="application/ld+json"]'
        ).all()

        products = []

        for script in scripts:

            try:

                text = await script.inner_text()

                if not text.strip():
                    continue

                data = json.loads(text)

                products.extend(
                    find_product_objects(data)
                )

            except Exception:
                continue

        if not products:

            print(
                "❌ No Product JSON-LD found on the page"
            )

            return None

        # ====================================================
        # Match the product by URL
        # ====================================================

        selected_product = None

        normalized_url = (
            product_url
            .rstrip("/")
            .lower()
        )

        for product in products:

            product_url_json = None

            offers = product.get("offers")

            if isinstance(offers, dict):

                product_url_json = offers.get(
                    "url"
                )

            if not product_url_json:

                product_url_json = product.get(
                    "url"
                )

            if product_url_json:

                product_url_json = (
                    str(product_url_json)
                    .rstrip("/")
                    .lower()
                )

                if (
                    product_url_json
                    == normalized_url
                ):

                    selected_product = product

                    break

        # ====================================================
        # If URL matching fails, try matching by product name
        # ====================================================

        if selected_product is None:

            target_name = (
                product_name
                .strip()
                .lower()
            )

            for product in products:

                name = product.get("name")

                if not name:
                    continue

                name = (
                    str(name)
                    .strip()
                    .lower()
                )

                if (
                    name == target_name
                    or target_name in name
                    or name in target_name
                ):

                    selected_product = product

                    break

        # ====================================================
        # Product not found
        # ====================================================

        if selected_product is None:

            print(
                "❌ Could not find the matching Product for the current page"
            )

            print(
                "\nProducts found on the page:"
            )

            for product in products:

                print(
                    "  -",
                    product.get("name"),
                    "|",
                    product.get("url"),
                )

            return None

        # ====================================================
        # Read offers
        # ====================================================

        offers = selected_product.get(
            "offers"
        )

        if not offers:

            print(
                "❌ The current product has no offers"
            )

            return None

        # ====================================================
        # Single Offer
        # ====================================================

        if isinstance(offers, dict):

            price = offers.get("price")

            if price is not None:

                try:

                    return float(
                        str(price)
                        .replace(",", ".")
                    )

                except ValueError:
                    pass

        # ====================================================
        # Multiple Offers
        # ====================================================

        if isinstance(offers, list):

            for offer in offers:

                if not isinstance(
                    offer,
                    dict
                ):
                    continue

                price = offer.get(
                    "price"
                )

                if price is None:
                    continue

                try:

                    return float(
                        str(price)
                        .replace(",", ".")
                    )

                except ValueError:
                    continue

        print(
            "❌ No price found in the current product offers"
        )

        return None

    except Exception as e:

        print(
            f"❌ Failed to read Product JSON-LD: {e}"
        )

        return None


# ============================================================
# Check one product
# ============================================================

async def check_product(page, product):

    name = product["name"]
    url = product["url"]

    target_price = float(
        product["target_price"]
    )

    print("\n" + "=" * 70)

    print(f"Product: {name}")

    print(f"URL：{url}")

    print(
        f"Target price: {target_price:.2f} kr"
    )

    try:

        await page.goto(
            url,
            wait_until="commit",
            timeout=60000,
        )

        # Wait specifically for JSON-LD instead of waiting
        # for the entire page to finish loading.
        try:
            await page.wait_for_selector(
                'script[type="application/ld+json"]',
                timeout=20000,
            )
        except Exception:
            print(
                "⚠️ JSON-LD did not appear within 20 seconds"
            )

        # Give scripts a little extra time
        await page.wait_for_timeout(3000)

        current_price = (
            await extract_product_price(
                page,
                product_name=name,
                product_url=url,
            )
        )

        if current_price is None:

            print(
                "❌ Could not read the current price"
            )

            return None

        # ====================================================
        # Compare prices
        # ====================================================

        below_target = (
            current_price <= target_price
        )

        difference = (
            current_price
            - target_price
        )

        if below_target:

            print(
                f"🟢 Current price: {current_price:.2f} kr"
            )

            print(
                f"🎯 Below target price: "
                f"{abs(difference):.2f} kr"
            )

        else:

            print(
                f"⚪ Current price: {current_price:.2f} kr"
            )

            print(
                f"Still needs to drop by: "
                f"{difference:.2f} kr"
            )

        # ====================================================
        # Return data for JSON output
        # ====================================================

        return {
            "name": name,
            "url": url,
            "target_price": target_price,
            "current_price": current_price,
            "below_target": below_target,
            "difference": round(
                difference,
                2
            ),
        }

    except Exception as e:

        print(
            f"❌ Failed to read page: {e}"
        )

        return None


# ============================================================
# Get Monday of the current week
# ============================================================

def get_monday():

    stockholm = ZoneInfo(
        "Europe/Stockholm"
    )

    now = datetime.now(
        stockholm
    )

    monday = (
        now
        - timedelta(
            days=now.weekday()
        )
    )

    return monday.date()


# ============================================================
# Save JSON
# ============================================================

def save_json(file_path, data):
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
            data,
            f,
            ensure_ascii=False,
            indent=2,
        )

def upload_json_to_gcs(
    blob_name,
    data,
):
    """
    Upload JSON to Google Cloud Storage
    """

    client = storage.Client()

    bucket = client.bucket(
        BUCKET_NAME
    )

    blob = bucket.blob(
        blob_name
    )

    json_text = json.dumps(
        data,
        ensure_ascii=False,
        indent=2,
    )

    blob.upload_from_string(
        json_text,
        content_type="application/json",
    )

    print(
        f"☁️ Upload successful: "
        f"gs://{BUCKET_NAME}/{blob_name}"
    )


# ============================================================
# Update history index
# ============================================================

def update_history_index(
    period
):

    periods = []

    if HISTORY_INDEX_FILE.exists():

        try:

            with open(
                HISTORY_INDEX_FILE,
                "r",
                encoding="utf-8",
            ) as f:

                old_data = json.load(f)

                periods = old_data.get(
                    "periods",
                    []
                )

        except Exception:

            periods = []

    if period not in periods:

        periods.append(period)

    # Keep newest dates first

    periods.sort(
        reverse=True
    )

    data = {
        "periods": periods
    }

    save_json(
        HISTORY_INDEX_FILE,
        data,
    )


# ============================================================
# Main program
# ============================================================

async def main():

    if not PRODUCTS_FILE.exists():

        print(
            f"File not found: {PRODUCTS_FILE}"
        )

        return

    # ========================================================
    # Read products.json
    # ========================================================

    with open(
        PRODUCTS_FILE,
        "r",
        encoding="utf-8",
    ) as f:

        products = json.load(f)

    # ========================================================
    # Date and time
    # ========================================================

    stockholm = ZoneInfo(
        "Europe/Stockholm"
    )

    now = datetime.now(
        stockholm
    )

    monday = get_monday()

    period = monday.isoformat()

    generated_at = now.isoformat()

    print("\n")
    print("=" * 70)
    print("Price check started")
    print(f"Period: {period}")
    print(f"Time: {generated_at}")
    print("=" * 70)

    results = []

    # ========================================================
    # Playwright
    # ========================================================

    async with async_playwright() as p:

        browser = await p.firefox.launch(
            headless=True
        )

        context = await browser.new_context(
            locale="sv-SE",
            timezone_id="Europe/Stockholm",
            viewport={
                "width": 1440,
                "height": 1000,
            },
        )

        page = await context.new_page()

        # ====================================================
        # Check all products
        # ====================================================

        for product in products:

            result = await check_product(
                page,
                product,
            )

            if result is not None:

                results.append(
                    result
                )

            # Avoid sending requests too quickly

            await asyncio.sleep(2)

        await browser.close()

    # ========================================================
    # Build final output data
    # ========================================================

    if not results:
        print(
            "❌ No product prices were collected."
        )

        print(
            "Existing Cloud Storage data "
            "will NOT be overwritten."
        )

        raise RuntimeError(
            "Price check failed: no products collected"
        )

    output = {
        "period": period,
        "generated_at": generated_at,
        "data": results,
    }

    # ========================================================
    # Save latest.json locally
    # ========================================================

    save_json(
        LATEST_FILE,
        output,
    )

    # ========================================================
    # Save history JSON locally
    # ========================================================

    history_file = (
        HISTORY_DIR
        / f"{period}.json"
    )

    save_json(
        history_file,
        output,
    )

    # ========================================================
    # Update local history/index.json
    # ========================================================

    update_history_index(
        period
    )

    # ========================================================
    # Upload latest.json to Google Cloud Storage
    # ========================================================

    upload_json_to_gcs(
        "latest.json",
        output,
    )

    # ========================================================
    # Upload this week's history JSON
    # ========================================================

    upload_json_to_gcs(
        f"history/{period}.json",
        output,
    )

    # ========================================================
    # Upload history/index.json
    # ========================================================

    with open(
        HISTORY_INDEX_FILE,
        "r",
        encoding="utf-8",
    ) as f:
        history_index = json.load(f)

    upload_json_to_gcs(
        "history/index.json",
        history_index,
    )

    # ========================================================
    # Summary
    # ========================================================

    print("\n")
    print("=" * 70)
    print("Completed")
    print("=" * 70)

    print(
        f"Successfully read: {len(results)} / "
        f"{len(products)}"
    )

    print(
        f"Latest data: {LATEST_FILE}"
    )

    print(
        f"History data: {history_file}"
    )

    print(
        f"History index: {HISTORY_INDEX_FILE}"
    )


if __name__ == "__main__":

    asyncio.run(main())