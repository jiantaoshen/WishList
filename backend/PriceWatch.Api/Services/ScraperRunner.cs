using System.Diagnostics;
using System.Text;

namespace PriceWatch.Api.Services;


public sealed class ScraperRunner
{
    private readonly string _pythonDirectory;

    private readonly object _lock =
        new();

    private Process? _process;


    public ScraperRunner(
        AppPaths paths
    )
    {
        _pythonDirectory =
            paths.PythonDirectory;
    }


    // ========================================================
    // Status
    // ========================================================

    public bool IsRunning
    {
        get
        {
            lock (_lock)
            {
                return (
                    _process is not null
                    &&
                    !_process.HasExited
                );
            }
        }
    }


    public int? ProcessId
    {
        get
        {
            lock (_lock)
            {
                if (
                    _process is null
                    ||
                    _process.HasExited
                )
                {
                    return null;
                }


                return _process.Id;
            }
        }
    }


    // ========================================================
    // Start scraper
    // ========================================================

    public bool TryStart(
        out string? error
    )
    {
        lock (_lock)
        {
            // =================================================
            // Already running through this C# process
            // =================================================

            if (
                _process is not null
                &&
                !_process.HasExited
            )
            {
                error =
                    "Price checker is already running.";

                return false;
            }


            // Clean up an old exited Process instance,
            // if one is still present for any reason.
            if (
                _process is not null
                &&
                _process.HasExited
            )
            {
                _process.Dispose();

                _process = null;
            }


            // =================================================
            // Scraper path
            // =================================================

            var scriptPath =
                Path.Combine(
                    _pythonDirectory,
                    "webscraping.py"
                );


            if (!Directory.Exists(
                _pythonDirectory
            ))
            {
                error =
                    $"Python directory not found: {_pythonDirectory}";

                return false;
            }


            if (!File.Exists(
                scriptPath
            ))
            {
                error =
                    $"Scraper not found: {scriptPath}";

                return false;
            }


            // =================================================
            // Python process
            // =================================================

            var startInfo =
                new ProcessStartInfo
                {
                    FileName =
                        "python",

                    WorkingDirectory =
                        _pythonDirectory,

                    UseShellExecute =
                        false,

                    RedirectStandardOutput =
                        true,

                    RedirectStandardError =
                        true,

                    StandardOutputEncoding =
                        Encoding.UTF8,

                    StandardErrorEncoding =
                        Encoding.UTF8,

                    CreateNoWindow =
                        true
                };


            // Prefer ArgumentList over a single argument string.
            // This avoids quoting issues when paths or arguments
            // contain spaces.
            startInfo.ArgumentList.Add(
                "-u"
            );

            startInfo.ArgumentList.Add(
                "webscraping.py"
            );


            // Force Python stdout / stderr to UTF-8.
            startInfo.Environment[
                "PYTHONUTF8"
            ] = "1";

            startInfo.Environment[
                "PYTHONIOENCODING"
            ] = "utf-8";


            var process =
                new Process
                {
                    StartInfo =
                        startInfo,

                    EnableRaisingEvents =
                        true
                };


            // =================================================
            // Console output
            // =================================================

            process.OutputDataReceived +=
                (_, eventArgs) =>
                {
                    if (
                        !string.IsNullOrWhiteSpace(
                            eventArgs.Data
                        )
                    )
                    {
                        Console.WriteLine(
                            $"[SCRAPER] {eventArgs.Data}"
                        );
                    }
                };


            process.ErrorDataReceived +=
                (_, eventArgs) =>
                {
                    if (
                        !string.IsNullOrWhiteSpace(
                            eventArgs.Data
                        )
                    )
                    {
                        Console.Error.WriteLine(
                            $"[SCRAPER ERROR] {eventArgs.Data}"
                        );
                    }
                };


            // =================================================
            // Start
            // =================================================

            try
            {
                if (!process.Start())
                {
                    process.Dispose();

                    error =
                        "Unable to start the Price Watch scraper.";

                    return false;
                }


                process.BeginOutputReadLine();

                process.BeginErrorReadLine();


                _process =
                    process;


                _ =
                    MonitorProcessAsync(
                        process
                    );


                error = null;

                return true;
            }
            catch (
                Exception exception
            )
            {
                process.Dispose();


                error =
                    exception.Message;


                return false;
            }
        }
    }


    // ========================================================
    // Monitor scraper
    // ========================================================

    private async Task MonitorProcessAsync(
        Process process
    )
    {
        try
        {
            await process
                .WaitForExitAsync();


            var exitCode =
                process.ExitCode;


            if (exitCode == 0)
            {
                Console.WriteLine(
                    "[SCRAPER] Finished successfully."
                );
            }
            else if (exitCode == 2)
            {
                // Python's cross-process lock uses exit code 2
                // when another scraper instance already owns
                // the global scraper lock.
                Console.WriteLine(
                    "[SCRAPER] Run skipped because another "
                    + "scraper process is already running."
                );
            }
            else
            {
                Console.Error.WriteLine(
                    $"[SCRAPER] Finished with exit code {exitCode}."
                );
            }
        }
        catch (
            Exception exception
        )
        {
            Console.Error.WriteLine(
                "[SCRAPER] Process monitoring failed: "
                + exception.Message
            );
        }
        finally
        {
            lock (_lock)
            {
                if (
                    ReferenceEquals(
                        _process,
                        process
                    )
                )
                {
                    _process = null;
                }
            }


            process.Dispose();
        }
    }
}
