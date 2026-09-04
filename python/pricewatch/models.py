from typing import Literal

from pydantic import BaseModel, Field

class ScrapeError(BaseModel):
    type: str
    message: str


class Offer(BaseModel):
    store: str
    url: str
    price: float


class ScrapeResult(BaseModel):
    product_id: str
    name: str
    url: str

    store: str | None = None

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

    offers: list[Offer] = Field(default_factory=list)

    error: ScrapeError | None = None