using System.Text;
using System.Text.Json;
using PriceWatch.Api.DTOs;
using PriceWatch.Api.Models;

namespace PriceWatch.Api.Services;

public sealed class ProductConfigService
{
    private readonly string _productsFile;

    private readonly SemaphoreSlim _writeLock = new(1, 1);

    private readonly JsonSerializerOptions _jsonOptions =
        new()
        {
            WriteIndented = true,
            PropertyNameCaseInsensitive = true
        };


    public ProductConfigService(AppPaths paths)
    {
        _productsFile = paths.ProductsFile;
    }




    // ========================================================
    // Get all products
    // ========================================================

    public async Task<List<ProductConfig>> GetAllAsync()
    {
        if (!File.Exists(_productsFile))
        {
            return [];
        }


        try
        {
            var json = await File.ReadAllTextAsync(_productsFile);

            if (string.IsNullOrWhiteSpace(json))
            {
                return [];
            }

            return JsonSerializer.Deserialize<List<ProductConfig>>(
                json,
                _jsonOptions
            ) ?? [];
        }
        catch (JsonException exception)
        {
            throw new InvalidOperationException(
                "products.json contains invalid JSON.",
                exception
            );
        }
    }


    // ========================================================
    // Create
    // ========================================================

    public async Task<ProductConfig> CreateAsync(ProductConfigInput input)
    {
        Validate(input);

        await _writeLock.WaitAsync();

        try
        {
            var products = await GetAllAsync();

            var product = new ProductConfig(

                GenerateId(products),

                input.Name.Trim(),

                input.Sources
                    .Select(source => new ProductSource(

                        source.Store.Trim(),

                        source.Url.Trim(),

                        source.UnitQuantity,

                        string.IsNullOrWhiteSpace(
                            source.Note
                        )
                            ? null
                            : source.Note.Trim()

                    ))
                    .ToList(),

                input.TargetPrice,

                input.TargetUnitPrice,

                string.IsNullOrWhiteSpace(
                    input.Unit
                )
                    ? null
                    : input.Unit.Trim(),

                input.Currency
                    .Trim()
                    .ToUpperInvariant()
            );

            products.Add(product);

            await SaveAsync(products);

            return product;
        }
        finally
        {
            _writeLock.Release();
        }
    }


    // ========================================================
    // Update
    // ========================================================

    public async Task<ProductConfig> UpdateAsync(
        string id,
        ProductConfigInput input
    )
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new ArgumentException(
                "Product ID is required."
            );
        }


        Validate(input);


        await _writeLock.WaitAsync();


        try
        {
            var products =
                await GetAllAsync();


            var index =
                products.FindIndex(
                    product =>
                        string.Equals(
                            product.Id,
                            id,
                            StringComparison.OrdinalIgnoreCase
                        )
                );


            if (index < 0)
            {
                throw new KeyNotFoundException(
                    "Product not found."
                );
            }


            var updated =
                new ProductConfig(

                    products[index].Id,

                    input.Name.Trim(),

                    input.Sources
                        .Select(
                            source =>
                                new ProductSource(

                                    source.Store.Trim(),

                                    source.Url.Trim(),

                                    source.UnitQuantity,

                                    string.IsNullOrWhiteSpace(
                                        source.Note
                                    )
                                        ? null
                                        : source.Note.Trim()
                                )
                        )
                        .ToList(),

                    input.TargetPrice,

                    input.TargetUnitPrice,

                    string.IsNullOrWhiteSpace(
                        input.Unit
                    )
                        ? null
                        : input.Unit.Trim(),

                    input.Currency
                        .Trim()
                        .ToUpperInvariant()
                );


            products[index] =
                updated;


            await SaveAsync(
                products
            );


            return updated;
        }
        finally
        {
            _writeLock.Release();
        }
    }


    // ========================================================
    // Delete
    // ========================================================

    public async Task DeleteAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new ArgumentException(
                "Product ID is required."
            );
        }


        await _writeLock.WaitAsync();

        try
        {
            var products = await GetAllAsync();

            var removed = products.RemoveAll(
                product =>
                    string.Equals(
                        product.Id,
                        id,
                        StringComparison.OrdinalIgnoreCase
                    )
            );

            if (removed == 0)
            {
                throw new KeyNotFoundException(
                    "Product not found."
                );
            }

            await SaveAsync(products);
        }
        finally
        {
            _writeLock.Release();
        }
    }


    // ========================================================
    // Save atomically
    // ========================================================

    private async Task SaveAsync(List<ProductConfig> products)
    {
        var directory = Path.GetDirectoryName(_productsFile);

        if (string.IsNullOrWhiteSpace(directory))
        {
            throw new InvalidOperationException(
                "Unable to determine the products directory."
            );
        }

        Directory.CreateDirectory(directory);

        var json = JsonSerializer.Serialize(
            products,
            _jsonOptions
        );

        var tempFile = _productsFile + ".tmp";

        try
        {
            await File.WriteAllTextAsync(
                tempFile,
                json + Environment.NewLine,
                new UTF8Encoding(false)
            );

            // Temp file and target are in the same directory,
            // so the final replacement avoids exposing a
            // partially written products.json.
            File.Move(
                tempFile,
                _productsFile,
                overwrite: true
            );
        }
        finally
        {
            if (File.Exists(tempFile))
            {
                File.Delete(tempFile);
            }
        }
    }


    // ========================================================
    // Validation
    // ========================================================

    private static void Validate(
        ProductConfigInput input
    )
    {
        // ========================================================
        // Name
        // ========================================================

        if (
            string.IsNullOrWhiteSpace(
                input.Name
            )
        )
        {
            throw new ArgumentException(
                "Product name is required."
            );
        }


        // ========================================================
        // Sources
        // ========================================================

        if (
            input.Sources is null ||
            input.Sources.Count == 0
        )
        {
            throw new ArgumentException(
                "At least one product source is required."
            );
        }


        foreach (
            var source
            in input.Sources
        )
        {
            // Store

            if (
                string.IsNullOrWhiteSpace(
                    source.Store
                )
            )
            {
                throw new ArgumentException(
                    "Store name is required for every source."
                );
            }


            // URL

            if (
                !Uri.TryCreate(
                    source.Url,
                    UriKind.Absolute,
                    out var url
                )
                ||
                (
                    url.Scheme !=
                        Uri.UriSchemeHttp
                    &&
                    url.Scheme !=
                        Uri.UriSchemeHttps
                )
            )
            {
                throw new ArgumentException(
                    $"A valid HTTP or HTTPS URL is required for store \"{source.Store}\"."
                );
            }


            // Unit quantity

            if (
                source.UnitQuantity is not null
                &&
                (
                    double.IsNaN(
                        source.UnitQuantity.Value
                    )
                    ||
                    double.IsInfinity(
                        source.UnitQuantity.Value
                    )
                    ||
                    source.UnitQuantity.Value <= 0
                )
            )
            {
                throw new ArgumentException(
                    $"Unit quantity for \"{source.Store}\" must be greater than zero."
                );
            }
        }


        // ========================================================
        // Duplicate URLs
        // ========================================================

        var duplicateUrl =
            input.Sources

                .GroupBy(
                    source =>
                        source.Url.Trim(),

                    StringComparer
                        .OrdinalIgnoreCase
                )

                .FirstOrDefault(
                    group =>
                        group.Count() > 1
                );


        if (duplicateUrl is not null)
        {
            throw new ArgumentException(
                $"Duplicate product URL: {duplicateUrl.Key}"
            );
        }


        // ========================================================
        // Total target
        // ========================================================

        if (
            double.IsNaN(
                input.TargetPrice
            )
            ||
            double.IsInfinity(
                input.TargetPrice
            )
            ||
            input.TargetPrice <= 0
        )
        {
            throw new ArgumentException(
                "Target price must be greater than zero."
            );
        }


        // ========================================================
        // Unit target
        // ========================================================

        if (
            input.TargetUnitPrice
            is not null
            &&
            (
                double.IsNaN(
                    input.TargetUnitPrice.Value
                )
                ||
                double.IsInfinity(
                    input.TargetUnitPrice.Value
                )
                ||
                input.TargetUnitPrice.Value <= 0
            )
        )
        {
            throw new ArgumentException(
                "Target unit price must be greater than zero."
            );
        }


        // ========================================================
        // Unit
        // ========================================================

        var hasUnitTracking =
            input.TargetUnitPrice
                is not null
            ||
            input.Sources.Any(
                source =>
                    source.UnitQuantity
                        is not null
            );


        if (
            hasUnitTracking
            &&
            string.IsNullOrWhiteSpace(
                input.Unit
            )
        )
        {
            throw new ArgumentException(
                "Unit is required when unit-price tracking is enabled."
            );
        }


        // ========================================================
        // Currency
        // ========================================================

        if (
            string.IsNullOrWhiteSpace(
                input.Currency
            )
        )
        {
            throw new ArgumentException(
                "Currency is required."
            );
        }
    }


    // ========================================================
    // Random ID Generator
    // ========================================================

    private static string GenerateId(IEnumerable<ProductConfig> products)
    {
        string id;

        do
        {
            id = Guid.NewGuid().ToString("N")[..16];
        }
        while (
            products.Any(
                product =>
                    string.Equals(
                        product.Id,
                        id,
                        StringComparison.OrdinalIgnoreCase
                    )
            )
        );

        return id;
    }
}