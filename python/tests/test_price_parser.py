import pytest

from pricewatch.price_parser import (
    parse_price,
)


@pytest.mark.parametrize(
    "value, expected",
    [
        ("399", 399.0),
        ("399.99", 399.99),
        ("399,99", 399.99),
        ("399 kr", 399.0),
        ("1 299 kr", 1299.0),
        ("€1.299,00", 1299.0),
        ("$1,299.00", 1299.0),
        ("£1,049", 1049.0),
        (1299, 1299.0),
        (1299.99, 1299.99),
    ],
)
def test_parse_price(
    value,
    expected,
):

    assert (
        parse_price(value)
        == expected
    )


@pytest.mark.parametrize(
    "value",
    [
        "",
        "kr",
        "N/A",
        None,
    ],
)
def test_invalid_price_text(
    value,
):

    assert (
        parse_price(value)
        is None
    )