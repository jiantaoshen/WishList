using System.Text.Json.Serialization;

namespace PriceWatch.Api.DTOs;


// =============================================================
// Product Source
// =============================================================

public sealed record ProductSourceInput(

    [property: JsonPropertyName("store")]
    string Store,

    [property: JsonPropertyName("url")]
    string Url,

    [property: JsonPropertyName("unit_quantity")]
    double? UnitQuantity,

    [property: JsonPropertyName("note")]
    string? Note
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

    [property: JsonPropertyName("target_unit_price")]
    double? TargetUnitPrice,

    [property: JsonPropertyName("unit")]
    string? Unit,

    [property: JsonPropertyName("currency")]
    string Currency
);