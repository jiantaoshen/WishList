from .base import BaseScraper
from pricewatch.strategies.json_ld import (extract_json_ld_price)

class GenericScraper(BaseScraper):
    async def extract_price(self,page,product) -> float | None:
        price = await extract_json_ld_price(
            page,
            product_name=product["name"],
            product_url=product["url"]
        )

        return price