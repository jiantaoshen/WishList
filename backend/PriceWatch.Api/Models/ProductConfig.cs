using System.Text.Json.Serialization;

namespace PriceWatch.Api.Models;

public sealed class ProductSource
{
    [JsonPropertyName("store")]
    public string Store { get; init; } = "";

    [JsonPropertyName("url")]
    public string Url { get; init; } = "";

    [JsonPropertyName("scraping_enabled")]
    public bool ScrapingEnabled { get; init; } = true;

    [JsonPropertyName("manual_price")]
    public double? ManualPrice { get; init; }

    [JsonPropertyName("unit_quantity")]
    public double? UnitQuantity { get; init; }

    [JsonPropertyName("note")]
    public string? Note { get; init; }
}


public sealed class ProductConfig
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = "";

    [JsonPropertyName("name")]
    public string Name { get; init; } = "";

    [JsonPropertyName("scraping_enabled")]
    public bool ScrapingEnabled { get; init; } = true;


    [JsonPropertyName("comparison_quantity")]
    public double? ComparisonQuantity { get; init; }

    [JsonPropertyName("sources")]
    public List<ProductSource> Sources { get; init; } = [];

    [JsonPropertyName("target_price")]
    public double TargetPrice { get; init; }

    [JsonPropertyName("target_unit_price")]
    public double? TargetUnitPrice { get; init; }

    [JsonPropertyName("unit")]
    public string? Unit { get; init; }

    [JsonPropertyName("currency")]
    public string Currency { get; init; } = "SEK";
}