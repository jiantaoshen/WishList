from abc import ABC, abstractmethod

#======================================
#Extract the current price from a loaded product page.
#======================================
class BaseScraper(ABC):
    @abstractmethod
    async def extract_price(self, page, product) -> float | None:
        pass