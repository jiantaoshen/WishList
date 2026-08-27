using System.Text.Json.Serialization;

namespace PriceWatch.Api.DTOs;

public sealed record ProductConfigInput(
    [property: JsonPropertyName("name")]
    string Name,

    [property: JsonPropertyName("url")]
    string Url,

    [property: JsonPropertyName("target_price")]
    double TargetPrice,

    [property: JsonPropertyName("currency")]
    string Currency
);