from .generic import GenericScraper

SCRAPERS = {"generic": GenericScraper()}

def get_scraper(product):
    scraper_name = product.get("scraper","generic")

    scraper = SCRAPERS.get(scraper_name)

    if scraper is None:
        raise ValueError(f"Unknown scraper: {scraper_name}")

    return scraper