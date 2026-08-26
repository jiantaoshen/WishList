using System.Text.Json.Serialization;

namespace PriceWatch.Api.Models;

public sealed record ProductConfig(
    [property: JsonPropertyName("id")]
    string Id,

    [property: JsonPropertyName("name")]
    string Name,

    [property: JsonPropertyName("url")]
    string Url,

    [property: JsonPropertyName("target_price")]
    double TargetPrice,

    [property: JsonPropertyName("currency")]
    string Currency
);