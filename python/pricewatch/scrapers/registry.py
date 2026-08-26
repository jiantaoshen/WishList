from pricewatch.scrapers.generic import (
    GenericScraper,
)


SCRAPER_REGISTRY = {
    "generic": GenericScraper,
}


def get_scraper(
    product: dict,
):
    config = product.get(
        "scraper"
    )

    # Old/simple format:
    #
    # "scraper": "generic"
    if isinstance(
        config,
        str,
    ):
        scraper_type = config

    # Extended format:
    #
    # "scraper": {
    #     "type": "generic"
    # }
    elif isinstance(
        config,
        dict,
    ):
        scraper_type = config.get(
            "type",
            "generic",
        )

    # No scraper config
    else:
        scraper_type = "generic"


    scraper_class = (
        SCRAPER_REGISTRY.get(
            scraper_type,
            GenericScraper,
        )
    )

    return scraper_class()