using System.Diagnostics;
using System.Globalization;
using System.Security.Principal;
using System.Text;
using System.Text.Json;

using PriceWatch.Api.Models;

namespace PriceWatch.Api.Services;


public sealed class ScheduleService
{
    private const string TaskName = "PriceWatch Weekly Check";

    private readonly string _settingsDirectory;
    private readonly string _scheduleFile;
    private readonly string _pythonDirectory;


    public ScheduleService(AppPaths paths)
    {
        _pythonDirectory = paths.PythonDirectory;
        _settingsDirectory = Path.Combine(paths.RootDirectory, "data", "settings");
        _scheduleFile = Path.Combine(_settingsDirectory, "schedule.json");
    }


    // ============================================================
    // Get
    // ============================================================

    public async Task<ScheduleStatus> GetAsync()
    {
        var taskExists = await TaskExistsAsync();

        if (!File.Exists(_scheduleFile)) {
            return DefaultStatus(taskExists);
        }

        try {
            var json = await File.ReadAllTextAsync(_scheduleFile);
            var config = JsonSerializer.Deserialize<ScheduleRequest>(json);

            if (config is null) return DefaultStatus(taskExists);

            return new ScheduleStatus(
                TaskExists: taskExists,
                Enabled: config.Enabled && taskExists,
                Day: config.Day,
                Time: config.Time,
                RunIfMissed: config.RunIfMissed
            );
        }
        catch (JsonException) {
            return DefaultStatus(taskExists);
        }
        catch (IOException) {
            return DefaultStatus(taskExists);
        }
    }


    // ============================================================
    // Create / Update
    // ============================================================

    public async Task<ScheduleStatus> ApplyAsync(ScheduleRequest request)
    {
        ValidateRequest(request);
        EnsureWindows();

        if (!request.Enabled) {
            await DisableTaskAsync();
            await SaveConfigAsync(request);

            return new ScheduleStatus(
                TaskExists: await TaskExistsAsync(),
                Enabled: false,
                Day: request.Day,
                Time: request.Time,
                RunIfMissed: request.RunIfMissed
            );
        }

        var scraperPath = Path.Combine(_pythonDirectory, "webscraping.py");

        if (!File.Exists(scraperPath)) {
            throw new InvalidOperationException($"Scraper not found: {scraperPath}");
        }

        var python = await FindPythonExecutableAsync();
        var user = WindowsIdentity.GetCurrent().Name;
        var day = Enum.Parse<DayOfWeek>(request.Day, ignoreCase: true);

        var psTaskName = QuotePowerShell(TaskName);
        var psPython = QuotePowerShell(python);
        var psWorkingDirectory = QuotePowerShell(_pythonDirectory);
        var psUser = QuotePowerShell(user);
        var psTime = QuotePowerShell(request.Time);
        var startWhenAvailable = request.RunIfMissed ? "$true" : "$false";

        var script =
            $$"""
            $ErrorActionPreference = 'Stop'

            $action = New-ScheduledTaskAction `
                -Execute {{psPython}} `
                -Argument '-u webscraping.py' `
                -WorkingDirectory {{psWorkingDirectory}}

            $trigger = New-ScheduledTaskTrigger `
                -Weekly `
                -WeeksInterval 1 `
                -DaysOfWeek {{day}} `
                -At {{psTime}}

            $settingsParams = @{
                MultipleInstances = 'IgnoreNew'
                AllowStartIfOnBatteries = $true
                DontStopIfGoingOnBatteries = $true
            }

            if ({{startWhenAvailable}}) {
                $settingsParams.StartWhenAvailable = $true
            }

            $settings = New-ScheduledTaskSettingsSet @settingsParams

            $principal = New-ScheduledTaskPrincipal `
                -UserId {{psUser}} `
                -LogonType Interactive `
                -RunLevel Limited

            $task = New-ScheduledTask `
                -Action $action `
                -Trigger $trigger `
                -Settings $settings `
                -Principal $principal

            Register-ScheduledTask `
                -TaskName {{psTaskName}} `
                -InputObject $task `
                -Force |
                Out-Null
            """;

        await RunPowerShellOrThrowAsync(
            script,
            "Failed to create scheduled task."
        );

        await SaveConfigAsync(request);

        return new ScheduleStatus(
            TaskExists: true,
            Enabled: true,
            Day: request.Day,
            Time: request.Time,
            RunIfMissed: request.RunIfMissed
        );
    }


    // ============================================================
    // Delete
    // ============================================================

    public async Task DeleteAsync()
    {
        EnsureWindows();

        var taskName = QuotePowerShell(TaskName);

        var script =
            $$"""
            $ErrorActionPreference = 'Stop'

            $task = Get-ScheduledTask `
                -TaskName {{taskName}} `
                -ErrorAction SilentlyContinue

            if ($null -ne $task) {
                Unregister-ScheduledTask `
                    -TaskName {{taskName}} `
                    -Confirm:$false
            }
            """;

        await RunPowerShellOrThrowAsync(
            script,
            "Failed to delete scheduled task."
        );

        if (File.Exists(_scheduleFile)) {
            File.Delete(_scheduleFile);
        }
    }


    // ============================================================
    // Disable
    // ============================================================

    private async Task DisableTaskAsync()
    {
        var taskName = QuotePowerShell(TaskName);

        var script =
            $$"""
            $ErrorActionPreference = 'Stop'

            $task = Get-ScheduledTask `
                -TaskName {{taskName}} `
                -ErrorAction SilentlyContinue

            if ($null -ne $task) {
                Disable-ScheduledTask `
                    -TaskName {{taskName}} |
                    Out-Null
            }
            """;

        await RunPowerShellOrThrowAsync(
            script,
            "Failed to disable scheduled task."
        );
    }


    // ============================================================
    // Exists
    // ============================================================

    private async Task<bool> TaskExistsAsync()
    {
        if (!OperatingSystem.IsWindows()) return false;

        var taskName = QuotePowerShell(TaskName);

        var script =
            $$"""
            $task = Get-ScheduledTask `
                -TaskName {{taskName}} `
                -ErrorAction SilentlyContinue

            if ($null -eq $task) {
                exit 1
            }

            exit 0
            """;

        var result = await RunPowerShellAsync(script);
        return result.ExitCode == 0;
    }


    // ============================================================
    // Config
    // ============================================================

    private async Task SaveConfigAsync(ScheduleRequest request)
    {
        Directory.CreateDirectory(_settingsDirectory);

        var json = JsonSerializer.Serialize(
            request,
            new JsonSerializerOptions {
                WriteIndented = true,
            }
        );

        var tempFile = _scheduleFile + ".tmp";

        try {
            await File.WriteAllTextAsync(tempFile, json, Encoding.UTF8);
            File.Move(tempFile, _scheduleFile, overwrite: true);
        }
        finally {
            if (File.Exists(tempFile)) {
                File.Delete(tempFile);
            }
        }
    }


    // ============================================================
    // Defaults
    // ============================================================

    private static ScheduleStatus DefaultStatus(bool taskExists)
    {
        return new ScheduleStatus(
            TaskExists: taskExists,
            Enabled: false,
            Day: "Monday",
            Time: "08:00",
            RunIfMissed: true
        );
    }


    // ============================================================
    // Validation
    // ============================================================

    private static void ValidateRequest(ScheduleRequest request)
    {
        if (!Enum.TryParse<DayOfWeek>(
            request.Day,
            ignoreCase: true,
            out _
        )) {
            throw new ArgumentException("Invalid day.");
        }

        if (!TimeOnly.TryParseExact(
            request.Time,
            "HH:mm",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out _
        )) {
            throw new ArgumentException("Time must use HH:mm format.");
        }
    }


    // ============================================================
    // Python
    // ============================================================

    private static async Task<string> FindPythonExecutableAsync()
    {
        EnsureWindows();

        var startInfo = new ProcessStartInfo {
            FileName = "where.exe",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };

        startInfo.ArgumentList.Add("python");

        using var process = Process.Start(startInfo);

        if (process is null) {
            throw new InvalidOperationException("Unable to locate Python.");
        }

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync();

        var output = await stdoutTask;
        var error = await stderrTask;

        var python = output
            .Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault();

        if (process.ExitCode != 0 || string.IsNullOrWhiteSpace(python)) {
            throw new InvalidOperationException(
                string.IsNullOrWhiteSpace(error)
                    ? "Python was not found in PATH."
                    : error.Trim()
            );
        }

        return python.Trim();
    }


    // ============================================================
    // PowerShell
    // ============================================================

    private static async Task RunPowerShellOrThrowAsync(
        string script,
        string fallback
    )
    {
        var result = await RunPowerShellAsync(script);

        if (result.ExitCode != 0) {
            throw new InvalidOperationException(
                GetPowerShellError(result, fallback)
            );
        }
    }


    private static async Task<(
        int ExitCode,
        string Output,
        string Error
    )> RunPowerShellAsync(string script)
    {
        EnsureWindows();

        var startInfo = new ProcessStartInfo {
            FileName = "powershell.exe",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8,
            CreateNoWindow = true,
        };

        startInfo.ArgumentList.Add("-NoProfile");
        startInfo.ArgumentList.Add("-NonInteractive");
        startInfo.ArgumentList.Add("-Command");
        startInfo.ArgumentList.Add(script);

        using var process = Process.Start(startInfo);

        if (process is null) {
            throw new InvalidOperationException("Unable to start PowerShell.");
        }

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync();

        return (
            process.ExitCode,
            await stdoutTask,
            await stderrTask
        );
    }


    // ============================================================
    // Helpers
    // ============================================================

    private static void EnsureWindows()
    {
        if (!OperatingSystem.IsWindows()) {
            throw new PlatformNotSupportedException(
                "Windows Task Scheduler is only supported on Windows."
            );
        }
    }


    private static string GetPowerShellError(
        (int ExitCode, string Output, string Error) result,
        string fallback
    )
    {
        if (!string.IsNullOrWhiteSpace(result.Error)) {
            return result.Error.Trim();
        }

        if (!string.IsNullOrWhiteSpace(result.Output)) {
            return result.Output.Trim();
        }

        return fallback;
    }


    private static string QuotePowerShell(string value)
    {
        return $"'{value.Replace("'", "''")}'";
    }
}