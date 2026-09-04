from typing import Literal

from pydantic import BaseModel, Field


class ScrapeError(BaseModel):
    type: str
    message: str


class Offer(BaseModel):
    store: str
    url: str

    # Total price
    price: float

    # Amount / quantity contained in this offer
    unit_quantity: float | None = None

    # price / unit_quantity
    unit_price: float | None = None

    # Gift / campaign / extra information
    note: str | None = None


class ScrapeResult(BaseModel):
    product_id: str
    name: str

    # =========================================================
    # Cheapest total price
    # =========================================================

    url: str
    store: str | None = None

    target_price: float

    current_price: float | None = None
    previous_price: float | None = None

    below_target: bool | None = None
    difference: float | None = None

    # =========================================================
    # Cheapest unit price
    # =========================================================

    unit: str | None = None

    unit_url: str | None = None
    unit_store: str | None = None

    target_unit_price: float | None = None

    current_unit_price: float | None = None
    previous_unit_price: float | None = None

    unit_below_target: bool | None = None
    unit_difference: float | None = None

    # =========================================================
    # General
    # =========================================================

    status: Literal[
        "success",
        "failed",
        "suspicious",
    ]

    currency: str = "SEK"

    offers: list[Offer] = Field(
        default_factory=list
    )

    error: ScrapeError | None = None