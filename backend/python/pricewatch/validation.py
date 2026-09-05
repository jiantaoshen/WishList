from enum import Enum

from pydantic import BaseModel


class PriceValidationStatus(str, Enum):
    VALID = "valid"
    INVALID = "invalid"
    SUSPICIOUS = "suspicious"


class PriceValidationResult(BaseModel):
    status: PriceValidationStatus
    message: str | None = None
    change_ratio: float | None = None


def validate_price(price: float, previous_price: float | None = None) -> PriceValidationResult:

    # ---------------------------------------------------------
    # Current price itself is invalid
    # ---------------------------------------------------------

    if price <= 0:
        return PriceValidationResult(
            status=PriceValidationStatus.INVALID,
            message="Price must be greater than zero",
        )

    # ---------------------------------------------------------
    # No previous price available
    # ---------------------------------------------------------

    if previous_price is None:
        return PriceValidationResult(
            status=PriceValidationStatus.VALID,
        )

    # ---------------------------------------------------------
    # Previous historical value is unusable.
    #
    # We do not reject the current price because the bad value
    # belongs to history, not to the current scraping result.
    # ---------------------------------------------------------

    if previous_price <= 0:
        return PriceValidationResult(
            status=PriceValidationStatus.VALID,
        )

    # ---------------------------------------------------------
    # Compare current price with previous price
    # ---------------------------------------------------------

    change_ratio = abs(
        price - previous_price
    ) / previous_price

    # More than 80% change is suspicious.
    #
    # It might still be real, so we do not classify it as
    # INVALID.
    # ---------------------------------------------------------

    if change_ratio > 0.80:
        return PriceValidationResult(
            status=PriceValidationStatus.SUSPICIOUS,
            message=(
                "Price changed by more than 80% "
                "compared with the previous price"
            ),
            change_ratio=change_ratio,
        )

    # ---------------------------------------------------------
    # Normal price
    # ---------------------------------------------------------

    return PriceValidationResult(
        status=PriceValidationStatus.VALID,
        change_ratio=change_ratio,
    )