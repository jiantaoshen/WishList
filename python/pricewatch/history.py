import json
from pathlib import Path

#=============================================================
# Find the most recent previous price for a product.
#
# The current period is skipped so that a rerun during
# the same week does not compare the product with itself.
#
#   Returns:
#     float:
#       Previous price if found.
#     None:
#       No previous price is available.
#==============================================================

def get_previous_price(history_dir: Path,current_period: str,product_id: str,) -> float | None:
    index_file = history_dir / "index.json"

    # No history exists yet
    if not index_file.exists():
        return None

    # Read history index
    try:
        with open(index_file, "r", encoding="utf-8") as f:
            index_data = json.load(f)

    except (OSError, json.JSONDecodeError):
        return None

    periods = index_data.get("periods", [])

    if not isinstance(periods, list):
        return None

    # Make sure newest periods are checked first.
    periods = sorted(periods, reverse=True)

    # Search previous history files
    for period in periods:
        # Do not compare the current run/week with itself.
        if period == current_period:
            continue

        history_file = history_dir / f"{period}.json"

        if not history_file.exists():
            continue

        # Read historical file
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                history_data = json.load(f)

        except (OSError, json.JSONDecodeError):
            continue

        products = history_data.get("data", [])

        if not isinstance(products, list):
            continue

        # Find matching product
        for product in products:

            if not isinstance(product, dict):
                continue

            # New history files use product_id.
            #
            # Older history files may not have product_id yet,
            # so product name is kept as a compatibility
            # fallback.
            stored_product_id = product.get("product_id") or product.get("name")

            if stored_product_id != product_id:
                continue

            price = product.get("current_price")

            if price is None:
                continue

            try:
                return float(price)
            except (
                TypeError,
                ValueError
            ):
                continue

    # Product not found in previous history
    return None