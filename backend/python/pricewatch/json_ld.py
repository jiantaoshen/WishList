import json
from .price_parser import parse_price


# ============================================================
# Recursively find Product objects in JSON-LD
#
# Supports:
# - Product
# - @graph
# - list
# ============================================================

def find_product_objects(data):
    results = []

    if isinstance(data, list):
        for item in data:
            results.extend(find_product_objects(item))

    elif isinstance(data, dict):
        item_type = data.get("@type")

        if item_type == "Product":
            results.append(data)
        elif isinstance(item_type, list) and "Product" in item_type:
            results.append(data)

        if "@graph" in data:
            results.extend(find_product_objects(data["@graph"]))

    return results


# ============================================================
# Normalize URL
# ============================================================

def normalize_url(url):
    if not url: return None
    return str(url).strip().rstrip("/").lower()


# ============================================================
# Normalize text
# ============================================================

def normalize_text(value):
    if value is None: return None
    return str(value).strip().lower()


# ============================================================
# Get URLs associated with a Product
# ============================================================

def get_product_urls(product):
    urls = []
    product_url = product.get("url")

    if product_url:
        normalized = normalize_url(product_url)
        if normalized: urls.append(normalized)

    offers = product.get("offers")

    if isinstance(offers, dict):
        offer_url = offers.get("url")

        if offer_url:
            normalized = normalize_url(offer_url)
            if normalized: urls.append(normalized)

    elif isinstance(offers, list):
        for offer in offers:
            if not isinstance(offer, dict): continue

            offer_url = offer.get("url")
            if not offer_url: continue

            normalized = normalize_url(offer_url)
            if normalized: urls.append(normalized)

    return urls


# ============================================================
# Get stable product identifiers
# ============================================================

def get_product_identifiers(product):
    identifiers = []

    for field in ["productID", "sku", "mpn"]:
        value = normalize_text(product.get(field))
        if value: identifiers.append(value)

    return identifiers


# ============================================================
# Read price from one Offer
# ============================================================

def extract_offer_price(offer):
    if not isinstance(offer, dict): return None

    price = parse_price(offer.get("price"))
    if price is not None: return price

    price_specification = offer.get("priceSpecification")

    if isinstance(price_specification, dict):
        price = parse_price(price_specification.get("price"))
        if price is not None: return price

    return None


# ============================================================
# Read current price from Product JSON-LD
# ============================================================

async def extract_json_ld_price(page, product_name, product_url):
    try:
        scripts = await page.locator('script[type="application/ld+json"]').all()
        products = []

        # ====================================================
        # Read JSON-LD scripts
        # ====================================================

        for script in scripts:
            try:
                text = await script.text_content()
                if not text or not text.strip(): continue

                data = json.loads(text)
                products.extend(find_product_objects(data))

            except (json.JSONDecodeError, TypeError):
                continue
            except Exception:
                continue

        # ====================================================
        # No Product JSON-LD
        # ====================================================

        if not products: return None

        selected_product = None
        normalized_url = normalize_url(product_url)

        # ====================================================
        # 1. Match by exact URL
        # ====================================================

        if normalized_url:
            for product in products:
                product_urls = get_product_urls(product)

                if normalized_url in product_urls:
                    selected_product = product
                    break

        # ====================================================
        # 2. Match by stable product identifier
        # ====================================================

        if selected_product is None and normalized_url:
            for product in products:
                identifiers = get_product_identifiers(product)

                for identifier in identifiers:
                    if identifier in normalized_url:
                        selected_product = product
                        break

                if selected_product is not None: break

        # ====================================================
        # 3. Match by product name
        # ====================================================

        if selected_product is None:
            target_name = normalize_text(product_name)

            if target_name:
                for product in products:
                    name = normalize_text(product.get("name"))
                    if not name: continue

                    if name == target_name or target_name in name or name in target_name:
                        selected_product = product
                        break

        # ====================================================
        # 4. If exactly one Product exists, use it
        # ====================================================

        if selected_product is None and len(products) == 1:
            selected_product = products[0]

        # ====================================================
        # Product not found
        # ====================================================

        if selected_product is None:
            print("❌ Could not find the matching Product for the current page")
            print("\nProducts found on the page:")

            for product in products:
                print(
                    "  -",
                    product.get("name"),
                    "| productID:", product.get("productID"),
                    "| sku:", product.get("sku"),
                    "| mpn:", product.get("mpn"),
                    "| urls:", get_product_urls(product),
                )

            return None

        # ====================================================
        # Read Offers
        # ====================================================

        offers = selected_product.get("offers")

        if not offers:
            print("❌ The current product has no offers")
            return None

        # ====================================================
        # Single Offer
        # ====================================================

        if isinstance(offers, dict):
            price = extract_offer_price(offers)
            if price is not None: return price

        # ====================================================
        # Multiple Offers
        # ====================================================

        elif isinstance(offers, list):
            for offer in offers:
                price = extract_offer_price(offer)
                if price is not None: return price

        print("❌ No price found in the current product offers")
        return None

    except Exception as error:
        print(f"❌ Failed to read Product JSON-LD: {error}")
        return None