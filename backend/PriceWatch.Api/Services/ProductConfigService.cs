using System.Text;
using System.Text.Json;

using PriceWatch.Api.Models;

namespace PriceWatch.Api.Services;


public sealed class ProductConfigService
{
    private readonly string _productsFile;

    private readonly SemaphoreSlim _writeLock =
        new(
            1,
            1
        );


    private readonly JsonSerializerOptions _jsonOptions =
        new()
        {
            WriteIndented =
                true,

            PropertyNameCaseInsensitive =
                true
        };


    public ProductConfigService(
        AppPaths paths
    )
    {
        _productsFile =
            paths.ProductsFile;
    }


    // ========================================================
    // Get all products
    // ========================================================

    public async Task<
        List<ProductConfig>
    > GetAllAsync()
    {
        if (!File.Exists(
            _productsFile
        ))
        {
            return [];
        }


        try
        {
            var json =
                await File.ReadAllTextAsync(
                    _productsFile
                );


            if (string.IsNullOrWhiteSpace(
                json
            ))
            {
                return [];
            }


            return
                JsonSerializer.Deserialize<
                    List<ProductConfig>
                >(
                    json,
                    _jsonOptions
                )
                ?? [];
        }
        catch (
            JsonException exception
        )
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

    public async Task<ProductConfig>
        CreateAsync(
            ProductConfig product
        )
    {
        Validate(
            product
        );


        await _writeLock
            .WaitAsync();


        try
        {
            var products =
                await GetAllAsync();


            if (
                products.Any(
                    existing =>
                        string.Equals(
                            existing.Id,
                            product.Id,
                            StringComparison
                                .OrdinalIgnoreCase
                        )
                )
            )
            {
                throw new InvalidOperationException(
                    "A product with this ID already exists."
                );
            }


            products.Add(
                product
            );


            await SaveAsync(
                products
            );


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

    public async Task<ProductConfig>
        UpdateAsync(
            string id,
            ProductConfig product
        )
    {
        if (
            string.IsNullOrWhiteSpace(
                id
            )
        )
        {
            throw new ArgumentException(
                "Product ID is required."
            );
        }


        Validate(
            product
        );


        await _writeLock
            .WaitAsync();


        try
        {
            var products =
                await GetAllAsync();


            var index =
                products.FindIndex(
                    existing =>
                        string.Equals(
                            existing.Id,
                            id,
                            StringComparison
                                .OrdinalIgnoreCase
                        )
                );


            if (index < 0)
            {
                throw new KeyNotFoundException(
                    "Product not found."
                );
            }


            // Product ID is stable.
            // The route ID wins over the request body.
            var updated =
                product with
                {
                    Id = id
                };


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

    public async Task DeleteAsync(
        string id
    )
    {
        if (
            string.IsNullOrWhiteSpace(
                id
            )
        )
        {
            throw new ArgumentException(
                "Product ID is required."
            );
        }


        await _writeLock
            .WaitAsync();


        try
        {
            var products =
                await GetAllAsync();


            var removed =
                products.RemoveAll(
                    product =>
                        string.Equals(
                            product.Id,
                            id,
                            StringComparison
                                .OrdinalIgnoreCase
                        )
                );


            if (removed == 0)
            {
                throw new KeyNotFoundException(
                    "Product not found."
                );
            }


            await SaveAsync(
                products
            );
        }
        finally
        {
            _writeLock.Release();
        }
    }


    // ========================================================
    // Save atomically
    // ========================================================

    private async Task SaveAsync(
        List<ProductConfig> products
    )
    {
        var directory =
            Path.GetDirectoryName(
                _productsFile
            );


        if (
            string.IsNullOrWhiteSpace(
                directory
            )
        )
        {
            throw new InvalidOperationException(
                "Unable to determine the products directory."
            );
        }


        Directory.CreateDirectory(
            directory
        );


        var json =
            JsonSerializer.Serialize(
                products,
                _jsonOptions
            );


        var tempFile =
            _productsFile
            + ".tmp";


        try
        {
            await File.WriteAllTextAsync(
                tempFile,
                json + Environment.NewLine,
                Encoding.UTF8
            );


            // Temp file and target are in the same directory,
            // so the final replacement avoids exposing a
            // partially written products.json.
            File.Move(
                tempFile,
                _productsFile,
                overwrite:
                    true
            );
        }
        finally
        {
            if (File.Exists(
                tempFile
            ))
            {
                File.Delete(
                    tempFile
                );
            }
        }
    }


    // ========================================================
    // Validation
    // ========================================================

    private static void Validate(
        ProductConfig product
    )
    {
        if (
            string.IsNullOrWhiteSpace(
                product.Id
            )
        )
        {
            throw new ArgumentException(
                "Product ID is required."
            );
        }


        if (
            string.IsNullOrWhiteSpace(
                product.Name
            )
        )
        {
            throw new ArgumentException(
                "Product name is required."
            );
        }


        if (
            !Uri.TryCreate(
                product.Url,
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
                "A valid HTTP or HTTPS URL is required."
            );
        }


        if (
            double.IsNaN(
                product.TargetPrice
            )
            ||
            double.IsInfinity(
                product.TargetPrice
            )
            ||
            product.TargetPrice <= 0
        )
        {
            throw new ArgumentException(
                "Target price must be greater than zero."
            );
        }


        if (
            string.IsNullOrWhiteSpace(
                product.Currency
            )
        )
        {
            throw new ArgumentException(
                "Currency is required."
            );
        }
    }
}