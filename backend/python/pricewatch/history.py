import json

from pathlib import Path


# =============================================================
# Internal
# =============================================================

def _read_json(path: Path):
    try:
        with path.open(
            "r",
            encoding="utf-8",
        ) as f:
            return json.load(f)

    except Exception:
        return None


# =============================================================
# Previous value
# =============================================================

def get_previous_value(
    history_dir: Path,
    current_period: str,
    product_id: str,
    field: str,
) -> float | None:

    if not history_dir.exists():
        return None

    history_files = []

    for path in history_dir.glob("*.json"):

        # index.json is not a history period
        if path.name == "index.json":
            continue

        period = path.stem

        # ISO dates sort correctly as strings.
        if period >= current_period:
            continue

        history_files.append(
            (
                period,
                path,
            )
        )

    # Newest first
    history_files.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    for _, path in history_files:

        data = _read_json(path)

        if not isinstance(data, dict):
            continue

        products = data.get("data")

        if not isinstance(products, list):
            continue

        for product in products:

            if not isinstance(product, dict):
                continue

            if product.get("product_id") != product_id:
                continue

            value = product.get(field)

            if (
                isinstance(value, (int, float))
                and not isinstance(value, bool)
            ):
                return float(value)

    return None


# =============================================================
# Total price
# =============================================================

def get_previous_price(
    history_dir: Path,
    current_period: str,
    product_id: str,
) -> float | None:

    return get_previous_value(
        history_dir=history_dir,
        current_period=current_period,
        product_id=product_id,
        field="current_price",
    )


# =============================================================
# Unit price
# =============================================================

def get_previous_unit_price(
    history_dir: Path,
    current_period: str,
    product_id: str,
) -> float | None:

    return get_previous_value(
        history_dir=history_dir,
        current_period=current_period,
        product_id=product_id,
        field="current_unit_price",
    )