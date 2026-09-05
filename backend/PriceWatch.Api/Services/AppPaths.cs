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


    public AppPaths(IWebHostEnvironment environment)
    {
        RootDirectory = ResolveRootDirectory(environment);

        PythonDirectory = Path.Combine(RootDirectory, "python");
        DataDirectory = Path.Combine(RootDirectory, "data");
        HistoryDirectory = Path.Combine(DataDirectory, "history");
        RunsDirectory = Path.Combine(DataDirectory, "runs");
        SettingsDirectory = Path.Combine(DataDirectory, "settings");

        LatestFile = Path.Combine(DataDirectory, "latest.json");
        ProductsFile = Path.Combine(PythonDirectory, "products.json");
        EnvFile = Path.Combine(RootDirectory, ".env");

        EnsureDirectories();

        Console.WriteLine($"[AppPaths] Root: {RootDirectory}");
        Console.WriteLine($"[AppPaths] Data: {DataDirectory}");
        Console.WriteLine($"[AppPaths] Python: {PythonDirectory}");
    }


    // ============================================================
    // Directories
    // ============================================================

    private void EnsureDirectories()
    {
        Directory.CreateDirectory(DataDirectory);
        Directory.CreateDirectory(HistoryDirectory);
        Directory.CreateDirectory(RunsDirectory);
        Directory.CreateDirectory(SettingsDirectory);
    }


    // ============================================================
    // Root
    // ============================================================

    private static string ResolveRootDirectory(
        IWebHostEnvironment environment
    )
    {
        var executableDirectory = Path.GetFullPath(
            AppContext.BaseDirectory
        );

        // Published app:
        //
        // publish/
        // ├─ PriceWatch.Api.exe
        // ├─ python/
        // └─ data/
        if (HasPythonDirectory(executableDirectory))
        {
            return executableDirectory;
        }

        // Development:
        // walk upwards from bin/... until project root is found.
        var root = FindProjectRoot(executableDirectory);

        if (root is not null)
        {
            return root;
        }

        // Fallback to ASP.NET content root.
        var contentRoot = Path.GetFullPath(
            environment.ContentRootPath
        );

        root = FindProjectRoot(contentRoot);

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


    private static string? FindProjectRoot(string startDirectory)
    {
        var directory = new DirectoryInfo(startDirectory);

        while (directory is not null)
        {
            if (HasPythonDirectory(directory.FullName))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        return null;
    }


    private static bool HasPythonDirectory(string directory)
    {
        return Directory.Exists(
            Path.Combine(directory, "python")
        );
    }
}