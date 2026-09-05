using System.Text;
using System.Text.Json;

using PriceWatch.Api.DTOs;
using PriceWatch.Api.Models;

namespace PriceWatch.Api.Services;


public sealed class ProductConfigService
{
    private readonly string _productsFile;
    private readonly SemaphoreSlim _writeLock = new(1, 1);

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
    };


    public ProductConfigService(AppPaths paths)
    {
        _productsFile = paths.ProductsFile;
    }


    // ============================================================
    // Get
    // ============================================================

    public async Task<List<ProductConfig>> GetAllAsync()
    {
        if (!File.Exists(_productsFile)) return [];

        try
        {
            var json = await File.ReadAllTextAsync(_productsFile);

            if (string.IsNullOrWhiteSpace(json)) return [];

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


    // ============================================================
    // Create
    // ============================================================

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


    // ============================================================
    // Update
    // ============================================================

    public async Task<ProductConfig> UpdateAsync(
        string id,
        ProductConfigInput input
    )
    {
        RequireId(id);
        Validate(input);

        await _writeLock.WaitAsync();

        try
        {
            var products = await GetAllAsync();

            var index = products.FindIndex(
                product => string.Equals(
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

            var updated = MapProduct(
                products[index].Id,
                input
            );

            products[index] = updated;

            await SaveAsync(products);

            return updated;
        }
        finally
        {
            _writeLock.Release();
        }
    }


    // ============================================================
    // Delete
    // ============================================================

    public async Task DeleteAsync(string id)
    {
        RequireId(id);

        await _writeLock.WaitAsync();

        try
        {
            var products = await GetAllAsync();

            var removed = products.RemoveAll(
                product => string.Equals(
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


    // ============================================================
    // Save
    // ============================================================

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


    // ============================================================
    // Validation
    // ============================================================

    private static void Validate(ProductConfigInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
        {
            throw new ArgumentException(
                "Product name is required."
            );
        }

        if (input.Sources is null || input.Sources.Count == 0)
        {
            throw new ArgumentException(
                "At least one store source is required."
            );
        }

        RequirePositive(
            input.TargetPrice,
            "Target price"
        );

        if (input.TargetUnitPrice is not null)
        {
            RequirePositive(
                input.TargetUnitPrice.Value,
                "Target unit price"
            );
        }

        if (input.ComparisonQuantity is not null)
        {
            RequirePositive(
                input.ComparisonQuantity.Value,
                "Comparison quantity"
            );
        }

        if (string.IsNullOrWhiteSpace(input.Currency))
        {
            throw new ArgumentException(
                "Currency is required."
            );
        }

        var urls = new HashSet<string>(
            StringComparer.OrdinalIgnoreCase
        );

        var hasUnitQuantity = false;

        for (var index = 0; index < input.Sources.Count; index++)
        {
            var source = input.Sources[index];
            var number = index + 1;

            if (string.IsNullOrWhiteSpace(source.Store))
            {
                throw new ArgumentException(
                    $"Store {number}: name is required."
                );
            }

            ValidateUrl(
                source.Url,
                number,
                urls
            );

            if (source.UnitQuantity is not null)
            {
                hasUnitQuantity = true;

                RequirePositive(
                    source.UnitQuantity.Value,
                    $"Store {number}: unit quantity"
                );
            }

            if (source.ManualPrice is not null)
            {
                RequirePositive(
                    source.ManualPrice.Value,
                    $"Store {number}: manual price"
                );
            }

            var shouldScrape =
                input.ScrapingEnabled &&
                source.ScrapingEnabled;

            if (!shouldScrape && source.ManualPrice is null)
            {
                throw new ArgumentException(
                    $"Store {number}: manual price is required when scraping is disabled."
                );
            }
        }

        var needsUnit =
            hasUnitQuantity ||
            input.TargetUnitPrice is not null ||
            input.ComparisonQuantity is not null;

        if (needsUnit && string.IsNullOrWhiteSpace(input.Unit))
        {
            throw new ArgumentException(
                "Unit is required when comparison or unit price tracking is enabled."
            );
        }
    }


    private static void ValidateUrl(
        string url,
        int number,
        HashSet<string> urls
    )
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            throw new ArgumentException(
                $"Store {number}: URL is required."
            );
        }

        var trimmed = url.Trim();

        if (
            !Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp &&
             uri.Scheme != Uri.UriSchemeHttps)
        )
        {
            throw new ArgumentException(
                $"Store {number}: URL must use http:// or https://."
            );
        }

        if (!urls.Add(trimmed))
        {
            throw new ArgumentException(
                "Store URLs must be unique."
            );
        }
    }


    private static void RequirePositive(
        double value,
        string label
    )
    {
        if (!double.IsFinite(value) || value <= 0)
        {
            throw new ArgumentException(
                $"{label} must be greater than 0."
            );
        }
    }


    private static void RequireId(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new ArgumentException(
                "Product ID is required."
            );
        }
    }


    // ============================================================
    // ID
    // ============================================================

    private static string GenerateId(
        IEnumerable<ProductConfig> products
    )
    {
        string id;

        do
        {
            id = Guid.NewGuid()
                .ToString("N")[..16];
        }
        while (
            products.Any(
                product => string.Equals(
                    product.Id,
                    id,
                    StringComparison.OrdinalIgnoreCase
                )
            )
        );

        return id;
    }


    // ============================================================
    // Mapping
    // ============================================================

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
            ComparisonQuantity = input.ComparisonQuantity,

            Sources = input.Sources
                .Select(source => new ProductSource
                {
                    Store = source.Store.Trim(),
                    Url = source.Url.Trim(),
                    ScrapingEnabled = source.ScrapingEnabled,
                    ManualPrice = source.ManualPrice,
                    UnitQuantity = source.UnitQuantity,
                    Note = Clean(source.Note),
                })
                .ToList(),

            TargetPrice = input.TargetPrice,
            TargetUnitPrice = input.TargetUnitPrice,
            Unit = Clean(input.Unit),

            Currency = input.Currency
                .Trim()
                .ToUpperInvariant(),
        };
    }


    private static string? Clean(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}