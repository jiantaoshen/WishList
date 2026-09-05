using System.Text.Json.Serialization;

namespace PriceWatch.Api.DTOs;


// =============================================================
// Product Source
// =============================================================

public sealed class ProductSourceInput
{
    [JsonPropertyName("store")]
    public string Store { get; init; } = "";

    [JsonPropertyName("url")]
    public string Url { get; init; } = "";

    // Old clients that do not send this field
    // should continue scraping.
    [JsonPropertyName("scraping_enabled")]
    public bool ScrapingEnabled { get; init; } = true;

    [JsonPropertyName("manual_price")]
    public double? ManualPrice { get; init; }

    [JsonPropertyName("unit_quantity")]
    public double? UnitQuantity { get; init; }

    [JsonPropertyName("note")]
    public string? Note { get; init; }
}

// =============================================================
// Product Config Input
// =============================================================

public sealed class ProductConfigInput
{
    [JsonPropertyName("name")]
    public string Name { get; init; } = "";

    [JsonPropertyName("scraping_enabled")]
    public bool ScrapingEnabled { get; init; } = true;

    [JsonPropertyName("comparison_quantity")]
    public double? ComparisonQuantity { get; init; }

    [JsonPropertyName("sources")]
    public List<ProductSourceInput> Sources { get; init; } = [];

    [JsonPropertyName("target_price")]
    public double TargetPrice { get; init; }

    [JsonPropertyName("target_unit_price")]
    public double? TargetUnitPrice { get; init; }

    [JsonPropertyName("unit")]
    public string? Unit { get; init; }

    [JsonPropertyName("currency")]
    public string Currency { get; init; } = "SEK";
}