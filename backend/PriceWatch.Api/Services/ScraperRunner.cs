using System.Diagnostics;
using System.Text;

namespace PriceWatch.Api.Services;


public sealed class ScraperRunner
{
    private readonly string _pythonDirectory;
    private readonly object _lock = new();

    private Process? _process;


    public ScraperRunner(AppPaths paths)
    {
        _pythonDirectory = paths.PythonDirectory;
    }


    // ============================================================
    // Status
    // ============================================================

    public bool IsRunning
    {
        get
        {
            lock (_lock)
            {
                return IsAlive(_process);
            }
        }
    }


    public int? ProcessId
    {
        get
        {
            lock (_lock)
            {
                return IsAlive(_process)
                    ? _process!.Id
                    : null;
            }
        }
    }


    // ============================================================
    // Start
    // ============================================================

    public bool TryStart(out string? error)
    {
        lock (_lock)
        {
            if (IsAlive(_process))
            {
                error = "Price checker is already running.";
                return false;
            }

            CleanupExitedProcess();

            var scriptPath = Path.Combine(
                _pythonDirectory,
                "webscraping.py"
            );

            if (!Directory.Exists(_pythonDirectory))
            {
                error = $"Python directory not found: {_pythonDirectory}";
                return false;
            }

            if (!File.Exists(scriptPath))
            {
                error = $"Scraper not found: {scriptPath}";
                return false;
            }

            var process = CreateProcess();

            try
            {
                if (!process.Start())
                {
                    process.Dispose();

                    error = "Unable to start the Price Watch scraper.";
                    return false;
                }

                process.BeginOutputReadLine();
                process.BeginErrorReadLine();

                _process = process;

                _ = MonitorProcessAsync(process);

                error = null;
                return true;
            }
            catch (Exception exception)
            {
                process.Dispose();

                error = exception.Message;
                return false;
            }
        }
    }


    // ============================================================
    // Process
    // ============================================================

    private Process CreateProcess()
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "python",
            WorkingDirectory = _pythonDirectory,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8,
            CreateNoWindow = true,
        };

        startInfo.ArgumentList.Add("-u");
        startInfo.ArgumentList.Add("webscraping.py");

        startInfo.Environment["PYTHONUTF8"] = "1";
        startInfo.Environment["PYTHONIOENCODING"] = "utf-8";

        var process = new Process
        {
            StartInfo = startInfo,
            EnableRaisingEvents = true,
        };

        process.OutputDataReceived += (_, args) =>
        {
            if (!string.IsNullOrWhiteSpace(args.Data))
            {
                Console.WriteLine(
                    $"[SCRAPER] {args.Data}"
                );
            }
        };

        process.ErrorDataReceived += (_, args) =>
        {
            if (!string.IsNullOrWhiteSpace(args.Data))
            {
                Console.Error.WriteLine(
                    $"[SCRAPER ERROR] {args.Data}"
                );
            }
        };

        return process;
    }


    // ============================================================
    // Monitor
    // ============================================================

    private async Task MonitorProcessAsync(Process process)
    {
        try
        {
            await process.WaitForExitAsync();

            switch (process.ExitCode)
            {
                case 0:
                    Console.WriteLine(
                        "[SCRAPER] Finished successfully."
                    );
                    break;

                case 2:
                    Console.WriteLine(
                        "[SCRAPER] Run skipped because another scraper process is already running."
                    );
                    break;

                default:
                    Console.Error.WriteLine(
                        $"[SCRAPER] Finished with exit code {process.ExitCode}."
                    );
                    break;
            }
        }
        catch (Exception exception)
        {
            Console.Error.WriteLine(
                $"[SCRAPER] Process monitoring failed: {exception.Message}"
            );
        }
        finally
        {
            lock (_lock)
            {
                if (ReferenceEquals(_process, process))
                {
                    _process = null;
                }
            }

            process.Dispose();
        }
    }


    // ============================================================
    // Helpers
    // ============================================================

    private static bool IsAlive(Process? process)
    {
        return process is not null && !process.HasExited;
    }


    private void CleanupExitedProcess()
    {
        if (_process is null || !_process.HasExited) return;

        _process.Dispose();
        _process = null;
    }
}