import re

def parse_price(
    value: str | int | float,
) -> float | None:

    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip()

    if not text:
        return None

    # Remove currency symbols / text
    text = re.sub(
        r"[^\d.,\s]",
        "",
        text,
    )

    # Remove spaces
    text = text.replace(" ", "")

    if not text:
        return None

    # Both comma and dot exist
    if "," in text and "." in text:

        # 1.299,00
        if text.rfind(",") > text.rfind("."):
            text = (
                text
                .replace(".", "")
                .replace(",", ".")
            )

        # 1,299.00
        else:
            text = text.replace(",", "")

    # Only comma
    elif "," in text:

        decimal_part = text.split(",")[-1]

        if len(decimal_part) == 2:
            text = text.replace(",", ".")

        else:
            text = text.replace(",", "")

    # Only dot
    elif "." in text:

        decimal_part = text.split(".")[-1]

        # 1.299 likely means 1299
        if len(decimal_part) == 3:
            text = text.replace(".", "")

    try:
        return float(text)

    except ValueError:
        return None