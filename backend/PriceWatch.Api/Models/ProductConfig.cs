using System.Text.Json.Serialization;

namespace PriceWatch.Api.Models;

public sealed record ProductSource(
    [property: JsonPropertyName("store")]
    string Store,

    [property: JsonPropertyName("url")]
    string Url
);


public sealed record ProductConfig(
    [property: JsonPropertyName("id")]
    string Id,

    [property: JsonPropertyName("name")]
    string Name,

    [property: JsonPropertyName("sources")]
    List<ProductSource> Sources,

    [property: JsonPropertyName("target_price")]
    double TargetPrice,

    [property: JsonPropertyName("currency")]
    string Currency
);