from pricewatch.validation import (
    PriceValidationStatus,
    validate_price,
)


def test_valid_price_without_history():

    result = validate_price(
        price=399,
    )

    assert (
        result.status
        == PriceValidationStatus.VALID
    )

    assert result.message is None


def test_zero_price_is_invalid():

    result = validate_price(
        price=0,
    )

    assert (
        result.status
        == PriceValidationStatus.INVALID
    )

    assert result.message is not None


def test_negative_price_is_invalid():

    result = validate_price(
        price=-100,
    )

    assert (
        result.status
        == PriceValidationStatus.INVALID
    )

    assert result.message is not None


def test_normal_price_change_is_valid():

    result = validate_price(
        price=349,
        previous_price=399,
    )

    assert (
        result.status
        == PriceValidationStatus.VALID
    )

    assert (
        result.change_ratio
        is not None
    )


def test_large_price_change_is_suspicious():

    result = validate_price(
        price=19.99,
        previous_price=399,
    )

    assert (
        result.status
        == PriceValidationStatus.SUSPICIOUS
    )

    assert result.message is not None

    assert (
        result.change_ratio
        is not None
    )

    assert (
        result.change_ratio
        > 0.80
    )


def test_exactly_80_percent_change_is_valid():

    result = validate_price(
        price=20,
        previous_price=100,
    )

    assert (
        result.status
        == PriceValidationStatus.VALID
    )


def test_invalid_previous_price_does_not_reject_current_price():

    result = validate_price(
        price=399,
        previous_price=0,
    )

    assert (
        result.status
        == PriceValidationStatus.VALID
    )