public sealed class AppPaths
{
    public string RootDirectory { get; }

    public string PythonDirectory { get; }

    public string DataDirectory { get; }

    public string HistoryDirectory { get; }

    public string RunsDirectory { get; }

    public string SettingsDirectory { get; }

    public string LatestFile { get; }

    public string ProductsFile { get; }

    public string EnvFile { get; }


    public AppPaths(
        IWebHostEnvironment environment
    )
    {
        RootDirectory =
            ResolveRootDirectory(
                environment
            );

        PythonDirectory =
            Path.Combine(
                RootDirectory,
                "python"
            );

        DataDirectory =
            Path.Combine(
                RootDirectory,
                "data"
            );

        HistoryDirectory =
            Path.Combine(
                DataDirectory,
                "history"
            );

        RunsDirectory =
            Path.Combine(
                DataDirectory,
                "runs"
            );

        SettingsDirectory =
            Path.Combine(
                DataDirectory,
                "settings"
            );

        LatestFile =
            Path.Combine(
                DataDirectory,
                "latest.json"
            );

        ProductsFile =
            Path.Combine(
                PythonDirectory,
                "products.json"
            );

        EnvFile =
            Path.Combine(
                RootDirectory,
                ".env"
            );


        // Make sure runtime directories exist.
        Directory.CreateDirectory(
            DataDirectory
        );

        Directory.CreateDirectory(
            HistoryDirectory
        );

        Directory.CreateDirectory(
            RunsDirectory
        );

        Directory.CreateDirectory(
            SettingsDirectory
        );


        Console.WriteLine(
            $"[AppPaths] Root: {RootDirectory}"
        );

        Console.WriteLine(
            $"[AppPaths] Data: {DataDirectory}"
        );

        Console.WriteLine(
            $"[AppPaths] Python: {PythonDirectory}"
        );
    }


    private static string ResolveRootDirectory(
        IWebHostEnvironment environment
    )
    {
        /*
         * ----------------------------------------------------
         * 1. Published application
         * ----------------------------------------------------
         *
         * publish/
         * ├── PriceWatch.Api.exe
         * ├── python/
         * └── data/
         *
         * In that case AppContext.BaseDirectory itself
         * is the application root.
         */

        var executableDirectory =
            Path.GetFullPath(
                AppContext.BaseDirectory
            );

        if (
            Directory.Exists(
                Path.Combine(
                    executableDirectory,
                    "python"
                )
            )
        )
        {
            return executableDirectory;
        }


        /*
         * ----------------------------------------------------
         * 2. Development mode
         * ----------------------------------------------------
         *
         * AppContext.BaseDirectory may be:
         *
         * WishList/
         *   backend/
         *     PriceWatch.Api/
         *       bin/
         *         Debug/
         *           net10.0-windows/
         *
         * Walk upwards until we find:
         *
         * WishList/python/
         */

        var root =
            FindProjectRoot(
                executableDirectory
            );

        if (root is not null)
        {
            return root;
        }


        /*
         * ----------------------------------------------------
         * 3. Fallback to ASP.NET ContentRootPath
         * ----------------------------------------------------
         */

        var contentRoot =
            Path.GetFullPath(
                environment.ContentRootPath
            );

        root =
            FindProjectRoot(
                contentRoot
            );

        if (root is not null)
        {
            return root;
        }


        throw new InvalidOperationException(
            "Unable to locate the Price Watch root directory. " +
            $"Executable directory: {executableDirectory}. " +
            $"Content root: {contentRoot}."
        );
    }


    private static string? FindProjectRoot(
        string startDirectory
    )
    {
        var directory =
            new DirectoryInfo(
                startDirectory
            );

        while (directory is not null)
        {
            var pythonDirectory =
                Path.Combine(
                    directory.FullName,
                    "python"
                );

            if (
                Directory.Exists(
                    pythonDirectory
                )
            )
            {
                return directory.FullName;
            }

            directory =
                directory.Parent;
        }

        return null;
    }
}