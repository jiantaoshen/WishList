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

            var product = MapProduct(
                GenerateId(products),
                input
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
                MapProduct(
                    products[index].Id,
                    input
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


        if (
            input.Sources is null ||
            input.Sources.Count == 0
        )
        {
            throw new ArgumentException(
                "At least one store source is required."
            );
        }


        if (
            !double.IsFinite(
                input.TargetPrice
            ) ||
            input.TargetPrice <= 0
        )
        {
            throw new ArgumentException(
                "Target price must be greater than 0."
            );
        }


        if (
            input.TargetUnitPrice is not null &&
            (
                !double.IsFinite(
                    input.TargetUnitPrice.Value
                ) ||
                input.TargetUnitPrice <= 0
            )
        )
        {
            throw new ArgumentException(
                "Target unit price must be greater than 0."
            );
        }


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


        var urls =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase
            );


        var hasUnitQuantity =
            false;


        for (
            var index = 0;
            index < input.Sources.Count;
            index++
        )
        {
            var source =
                input.Sources[index];

            var number =
                index + 1;


            // Store

            if (
                string.IsNullOrWhiteSpace(
                    source.Store
                )
            )
            {
                throw new ArgumentException(
                    $"Store {number}: name is required."
                );
            }


            // URL

            if (
                string.IsNullOrWhiteSpace(
                    source.Url
                )
            )
            {
                throw new ArgumentException(
                    $"Store {number}: URL is required."
                );
            }


            if (
                !Uri.TryCreate(
                    source.Url,
                    UriKind.Absolute,
                    out var uri
                ) ||
                (
                    uri.Scheme !=
                        Uri.UriSchemeHttp &&
                    uri.Scheme !=
                        Uri.UriSchemeHttps
                )
            )
            {
                throw new ArgumentException(
                    $"Store {number}: URL must use http:// or https://."
                );
            }


            // Duplicate URL

            if (
                !urls.Add(
                    source.Url.Trim()
                )
            )
            {
                throw new ArgumentException(
                    "Store URLs must be unique."
                );
            }


            // Unit quantity

            if (
                source.UnitQuantity is not null
            )
            {
                hasUnitQuantity =
                    true;


                if (
                    !double.IsFinite(
                        source.UnitQuantity.Value
                    ) ||
                    source.UnitQuantity <= 0
                )
                {
                    throw new ArgumentException(
                        $"Store {number}: unit quantity must be greater than 0."
                    );
                }
            }


            // Manual price

            if (
                source.ManualPrice is not null &&
                (
                    !double.IsFinite(
                        source.ManualPrice.Value
                    ) ||
                    source.ManualPrice <= 0
                )
            )
            {
                throw new ArgumentException(
                    $"Store {number}: manual price must be greater than 0."
                );
            }


            // Effective scraper state:
            //
            // Product ON + Source ON
            // = scrape
            //
            // anything else
            // = manual

            var shouldScrape =
                input.ScrapingEnabled &&
                source.ScrapingEnabled;


            if (
                !shouldScrape &&
                source.ManualPrice is null
            )
            {
                throw new ArgumentException(
                    $"Store {number}: manual price is required when scraping is disabled."
                );
            }
        }


        // Unit required when unit tracking is used.

        if (
            (
                hasUnitQuantity ||
                input.TargetUnitPrice is not null
            ) &&
            string.IsNullOrWhiteSpace(
                input.Unit
            )
        )
        {
            throw new ArgumentException(
                "Unit is required when unit price tracking is enabled."
            );
        }

        // Comparison quantity must be greater than 0 if provided.
        if (
            input.ComparisonQuantity is not null &&
            (
                !double.IsFinite(
                    input.ComparisonQuantity.Value
                ) ||
                input.ComparisonQuantity.Value <= 0
            )
        )
        {
            throw new ArgumentException(
                "Comparison quantity must be greater than 0."
            );
        }

        // Comparison 
        if (
            input.ComparisonQuantity is not null &&
            string.IsNullOrWhiteSpace(
                input.Unit
            )
        )
        {
            throw new ArgumentException(
                "Unit is required when comparison quantity is set."
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

    private static ProductConfig MapProduct(
        string id,
        ProductConfigInput input
    )
    {
        return new ProductConfig
        {
            Id = id,

            Name = input.Name.Trim(),

            ScrapingEnabled = input.ScrapingEnabled,

            ComparisonQuantity =
                input.ComparisonQuantity,

            Sources = input.Sources
                .Select(source => new ProductSource
                {
                    Store = source.Store.Trim(),

                    Url = source.Url.Trim(),

                    ScrapingEnabled =
                        source.ScrapingEnabled,

                    ManualPrice =
                        source.ManualPrice,

                    UnitQuantity =
                        source.UnitQuantity,

                    Note =
                        string.IsNullOrWhiteSpace(
                            source.Note
                        )
                            ? null
                            : source.Note.Trim(),
                })
                .ToList(),

            TargetPrice =
                input.TargetPrice,

            TargetUnitPrice =
                input.TargetUnitPrice,

            Unit =
                string.IsNullOrWhiteSpace(
                    input.Unit
                )
                    ? null
                    : input.Unit.Trim(),

            Currency =
                input.Currency
                    .Trim()
                    .ToUpperInvariant(),
        };
    }
}