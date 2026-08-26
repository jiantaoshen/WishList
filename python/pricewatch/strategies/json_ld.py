import json
from pricewatch.price_parser import parse_price

# ============================================================
# Recursively find Product objects in JSON-LD.
#    Supports:
#    - Product
#    - @graph
#    - list
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

        elif isinstance(item_type, list):
            if "Product" in item_type:
                results.append(data)

        if "@graph" in data:
            results.extend(find_product_objects(data["@graph"]))

    return results


# ============================================================
# Read the current price from product JSON-LD
# ============================================================

async def extract_json_ld_price(page,product_name,product_url):
    try:
        scripts = await page.locator('script[type="application/ld+json"]').all()
        products = []

        for script in scripts:
            try:
                text = await script.text_content()

                if not text.strip():
                    continue

                data = json.loads(text)

                products.extend(find_product_objects(data))

            except Exception:
                continue

        if not products:
            return None

        # ====================================================
        # Match the product by URL
        # ====================================================

        selected_product = None
        normalized_url = (product_url.rstrip("/").lower())

        for product in products:
            product_url_json = None
            offers = product.get("offers")

            if isinstance(offers, dict):
                product_url_json = offers.get("url")

            if not product_url_json:
                product_url_json = product.get("url")

            if product_url_json:
                product_url_json = (
                    str(product_url_json)
                    .rstrip("/")
                    .lower()
                )

                if (product_url_json == normalized_url):
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

                name = (str(name).strip().lower())

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

        if selected_product is None :

            print("❌ Could not find the matching Product for the current page")

            print("\nProducts found on the page:")

            for product in products:
                print("  -", product.get("name"),"|",product.get("url"))

            return None

        # ====================================================
        # Read offers
        # ====================================================

        offers = selected_product.get("offers")

        if not offers:
            print("❌ The current product has no offers")

            return None

        # ====================================================
        # Single Offer
        # ====================================================

        if isinstance(offers, dict):

            price = offers.get("price")

            parsed_price = parse_price(price)

            if parsed_price is not None:
                return parsed_price

        # ====================================================
        # Multiple Offers
        # ====================================================

        if isinstance(offers, list):
            for offer in offers:
                if not isinstance(offer,dict):
                    continue

                price = offer.get("price")

                if price is None:
                    continue

                try:
                    return float(str(price).replace(",", "."))

                except ValueError:
                    continue

        print("❌ No price found in the current product offers")

        return None

    except Exception as e:

        print(f"❌ Failed to read Product JSON-LD: {e}")

        return None
