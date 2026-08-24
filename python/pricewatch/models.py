from typing import Literal

from pydantic import BaseModel


class ScrapeError(BaseModel):
    type: str
    message: str


class ScrapeResult(BaseModel):
    product_id: str
    name: str
    url: str

    target_price: float

    status: Literal[
        "success",
        "failed",
        "suspicious",
    ]

    current_price: float | None = None
    previous_price: float | None = None

    below_target: bool | None = None
    difference: float | None = None

    currency: str = "SEK"

    error: ScrapeError | None = None