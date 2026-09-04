using System.Text.Json.Serialization;

namespace PriceWatch.Api.DTOs;


// =============================================================
// Product Source
// =============================================================

public sealed record ProductSourceInput(
    [property: JsonPropertyName("store")]
    string Store,

    [property: JsonPropertyName("url")]
    string Url
);

// =============================================================
// Product Config Input
// =============================================================

public sealed record ProductConfigInput(
    [property: JsonPropertyName("name")]
    string Name,

    [property: JsonPropertyName("sources")]
    List<ProductSourceInput> Sources,

    [property: JsonPropertyName("target_price")]
    double TargetPrice,

    [property: JsonPropertyName("currency")]
    string Currency
);