using System.Diagnostics;
using System.Net.Mail;
using System.Text;

using PriceWatch.Api.Models;

namespace PriceWatch.Api.Services;


public sealed class EmailSettingsService
{
    private static readonly string[] ManagedKeys =
    [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "EMAIL_FROM",
        "EMAIL_TO"
    ];


    private readonly string _envFile;

    private readonly string _pythonDirectory;

    private readonly string _testEmailFile;


    private readonly SemaphoreSlim _writeLock =
        new(
            1,
            1
        );


    public EmailSettingsService(
        AppPaths paths
    )
    {
        _envFile =
            paths.EnvFile;


        _pythonDirectory =
            paths.PythonDirectory;


        _testEmailFile =
            Path.Combine(
                paths.PythonDirectory,
                "test_email.py"
            );
    }


    // ========================================================
    // Get settings
    // ========================================================

    public async Task<EmailSettingsResponse>
        GetAsync()
    {
        var values =
            await ReadEnvironmentAsync();


        var port =
            587;


        if (
            values.TryGetValue(
                "SMTP_PORT",
                out var portText
            )
            &&
            int.TryParse(
                portText,
                out var parsedPort
            )
            &&
            parsedPort >= 1
            &&
            parsedPort <= 65535
        )
        {
            port =
                parsedPort;
        }


        values.TryGetValue(
            "SMTP_PASSWORD",
            out var password
        );


        return new EmailSettingsResponse(
            SmtpHost:
                GetValue(
                    values,
                    "SMTP_HOST"
                ),

            SmtpPort:
                port,

            SmtpUser:
                GetValue(
                    values,
                    "SMTP_USER"
                ),

            EmailFrom:
                GetValue(
                    values,
                    "EMAIL_FROM"
                ),

            EmailTo:
                GetValue(
                    values,
                    "EMAIL_TO"
                ),

            HasPassword:
                !string.IsNullOrWhiteSpace(
                    password
                )
        );
    }


    // ========================================================
    // Save settings
    // ========================================================

    public async Task<EmailSettingsResponse>
        SaveAsync(
            UpdateEmailSettingsRequest request
        )
    {
        Validate(
            request
        );


        await _writeLock
            .WaitAsync();


        try
        {
            var values =
                await ReadEnvironmentAsync();


            values["SMTP_HOST"] =
                request.SmtpHost.Trim();


            values["SMTP_PORT"] =
                request.SmtpPort.ToString();


            values["SMTP_USER"] =
                request.SmtpUser.Trim();


            values["EMAIL_FROM"] =
                request.EmailFrom.Trim();


            values["EMAIL_TO"] =
                request.EmailTo.Trim();


            // Empty password means:
            // keep the currently stored password.
            if (
                !string.IsNullOrWhiteSpace(
                    request.SmtpPassword
                )
            )
            {
                values["SMTP_PASSWORD"] =
                    request.SmtpPassword;
            }
            else if (
                !values.TryGetValue(
                    "SMTP_PASSWORD",
                    out var existingPassword
                )
                ||
                string.IsNullOrWhiteSpace(
                    existingPassword
                )
            )
            {
                throw new ArgumentException(
                    "SMTP password is required."
                );
            }


            await WriteEnvironmentAsync(
                values
            );


            return BuildResponse(
                values
            );
        }
        finally
        {
            _writeLock.Release();
        }
    }


    // ========================================================
    // Send test email
    // ========================================================

    public async Task<EmailTestResult>
        TestAsync()
    {
        if (!Directory.Exists(
            _pythonDirectory
        ))
        {
            return new EmailTestResult(
                false,
                $"Python directory was not found: {_pythonDirectory}"
            );
        }


        if (!File.Exists(
            _testEmailFile
        ))
        {
            return new EmailTestResult(
                false,
                $"test_email.py was not found: {_testEmailFile}"
            );
        }


        var settings =
            await GetAsync();


        if (
            string.IsNullOrWhiteSpace(
                settings.SmtpHost
            )
            ||
            string.IsNullOrWhiteSpace(
                settings.SmtpUser
            )
            ||
            string.IsNullOrWhiteSpace(
                settings.EmailFrom
            )
            ||
            string.IsNullOrWhiteSpace(
                settings.EmailTo
            )
            ||
            !settings.HasPassword
        )
        {
            return new EmailTestResult(
                false,
                "Email settings are incomplete. Save the SMTP settings first."
            );
        }


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


        startInfo.ArgumentList.Add(
            "-u"
        );


        startInfo.ArgumentList.Add(
            "test_email.py"
        );


        // Force Python stdout / stderr to UTF-8.
        startInfo.Environment[
            "PYTHONUTF8"
        ] = "1";


        startInfo.Environment[
            "PYTHONIOENCODING"
        ] = "utf-8";


        try
        {
            using var process =
                Process.Start(
                    startInfo
                );


            if (process is null)
            {
                return new EmailTestResult(
                    false,
                    "Unable to start the email test."
                );
            }


            var stdoutTask =
                process
                    .StandardOutput
                    .ReadToEndAsync();


            var stderrTask =
                process
                    .StandardError
                    .ReadToEndAsync();


            await process
                .WaitForExitAsync();


            var stdout =
                await stdoutTask;


            var stderr =
                await stderrTask;


            if (process.ExitCode == 0)
            {
                if (
                    !string.IsNullOrWhiteSpace(
                        stdout
                    )
                )
                {
                    Console.WriteLine(
                        $"[EMAIL TEST] {stdout.Trim()}"
                    );
                }


                return new EmailTestResult(
                    true,
                    "Test email sent successfully."
                );
            }


            var details =
                GetProcessFailureDetails(
                    stdout,
                    stderr,
                    process.ExitCode
                );


            Console.Error.WriteLine(
                $"[EMAIL TEST ERROR] {details}"
            );


            return new EmailTestResult(
                false,
                $"Failed to send test email. {details}"
            );
        }
        catch (
            Exception exception
        )
        {
            Console.Error.WriteLine(
                "[EMAIL TEST ERROR] "
                + exception.Message
            );


            return new EmailTestResult(
                false,
                "Unable to run the email test: "
                + exception.Message
            );
        }
    }


    // ========================================================
    // Read .env
    // ========================================================

    private async Task<
        Dictionary<string, string>
    > ReadEnvironmentAsync()
    {
        var values =
            new Dictionary<
                string,
                string
            >(
                StringComparer.OrdinalIgnoreCase
            );


        if (!File.Exists(
            _envFile
        ))
        {
            return values;
        }


        var lines =
            await File.ReadAllLinesAsync(
                _envFile
            );


        foreach (
            var rawLine in lines
        )
        {
            var line =
                rawLine.Trim();


            if (
                string.IsNullOrWhiteSpace(
                    line
                )
                ||
                line.StartsWith('#')
            )
            {
                continue;
            }


            var separator =
                line.IndexOf('=');


            if (separator <= 0)
            {
                continue;
            }


            var key =
                line[..separator]
                    .Trim();


            var rawValue =
                line[
                    (separator + 1)..
                ]
                .Trim();


            values[key] =
                ParseEnvValue(
                    rawValue
                );
        }


        return values;
    }


    // ========================================================
    // Write .env atomically
    // ========================================================

    private async Task WriteEnvironmentAsync(
        Dictionary<string, string> values
    )
    {
        var directory =
            Path.GetDirectoryName(
                _envFile
            );


        if (
            string.IsNullOrWhiteSpace(
                directory
            )
        )
        {
            throw new InvalidOperationException(
                "Unable to determine the .env directory."
            );
        }


        Directory.CreateDirectory(
            directory
        );


        var lines =
            new List<string>();


        foreach (
            var key in ManagedKeys
        )
        {
            if (
                values.TryGetValue(
                    key,
                    out var value
                )
            )
            {
                lines.Add(
                    $"{key}={FormatEnvValue(value)}"
                );
            }
        }


        // Preserve future unrelated settings.
        foreach (
            var pair in values
        )
        {
            if (
                ManagedKeys.Contains(
                    pair.Key,
                    StringComparer.OrdinalIgnoreCase
                )
            )
            {
                continue;
            }


            lines.Add(
                $"{pair.Key}={FormatEnvValue(pair.Value)}"
            );
        }


        var tempFile =
            _envFile
            + ".tmp";


        try
        {
            await File.WriteAllLinesAsync(
                tempFile,
                lines,
                new UTF8Encoding(
                    encoderShouldEmitUTF8Identifier:
                        false
                )
            );


            // tempFile and .env live in the same directory.
            // Replacing only after the full file is written
            // avoids exposing a partially written .env file.
            File.Move(
                tempFile,
                _envFile,
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
    // Response helper
    // ========================================================

    private static EmailSettingsResponse
        BuildResponse(
            Dictionary<string, string> values
        )
    {
        var port =
            587;


        if (
            values.TryGetValue(
                "SMTP_PORT",
                out var portText
            )
            &&
            int.TryParse(
                portText,
                out var parsedPort
            )
            &&
            parsedPort >= 1
            &&
            parsedPort <= 65535
        )
        {
            port =
                parsedPort;
        }


        values.TryGetValue(
            "SMTP_PASSWORD",
            out var password
        );


        return new EmailSettingsResponse(
            SmtpHost:
                GetValue(
                    values,
                    "SMTP_HOST"
                ),

            SmtpPort:
                port,

            SmtpUser:
                GetValue(
                    values,
                    "SMTP_USER"
                ),

            EmailFrom:
                GetValue(
                    values,
                    "EMAIL_FROM"
                ),

            EmailTo:
                GetValue(
                    values,
                    "EMAIL_TO"
                ),

            HasPassword:
                !string.IsNullOrWhiteSpace(
                    password
                )
        );
    }


    // ========================================================
    // .env value helpers
    // ========================================================

    private static string ParseEnvValue(
        string value
    )
    {
        if (
            value.Length >= 2
            &&
            value.StartsWith('"')
            &&
            value.EndsWith('"')
        )
        {
            return value[1..^1]
                .Replace(
                    "\\\"",
                    "\""
                )
                .Replace(
                    "\\\\",
                    "\\"
                );
        }


        if (
            value.Length >= 2
            &&
            value.StartsWith('\'')
            &&
            value.EndsWith('\'')
        )
        {
            return value[1..^1];
        }


        return value;
    }


    private static string FormatEnvValue(
        string value
    )
    {
        if (
            value.Contains('\r')
            ||
            value.Contains('\n')
        )
        {
            throw new ArgumentException(
                "Environment values cannot contain line breaks."
            );
        }


        var requiresQuotes =
            value.Length == 0
            ||
            value.Any(
                char.IsWhiteSpace
            )
            ||
            value.Contains('#')
            ||
            value.Contains('=')
            ||
            value.Contains('"')
            ||
            value.Contains('\'');


        if (!requiresQuotes)
        {
            return value;
        }


        var escaped =
            value
                .Replace(
                    "\\",
                    "\\\\"
                )
                .Replace(
                    "\"",
                    "\\\""
                );


        return
            $"\"{escaped}\"";
    }


    // ========================================================
    // Validation
    // ========================================================

    private static void Validate(
        UpdateEmailSettingsRequest request
    )
    {
        if (
            string.IsNullOrWhiteSpace(
                request.SmtpHost
            )
        )
        {
            throw new ArgumentException(
                "SMTP host is required."
            );
        }


        if (
            request.SmtpHost.Contains('\r')
            ||
            request.SmtpHost.Contains('\n')
        )
        {
            throw new ArgumentException(
                "SMTP host is invalid."
            );
        }


        if (
            request.SmtpPort < 1
            ||
            request.SmtpPort > 65535
        )
        {
            throw new ArgumentException(
                "Invalid SMTP port."
            );
        }


        if (
            string.IsNullOrWhiteSpace(
                request.SmtpUser
            )
        )
        {
            throw new ArgumentException(
                "SMTP user is required."
            );
        }


        ValidateEmail(
            request.EmailFrom,
            "Email From"
        );


        ValidateEmail(
            request.EmailTo,
            "Email To"
        );
    }


    private static void ValidateEmail(
        string value,
        string field
    )
    {
        try
        {
            var address =
                new MailAddress(
                    value
                );


            // MailAddress can accept display-name syntax.
            // For this settings UI we require one plain address.
            if (
                !string.Equals(
                    address.Address,
                    value.Trim(),
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                throw new FormatException();
            }
        }
        catch
        {
            throw new ArgumentException(
                $"{field} is not a valid email address."
            );
        }
    }


    // ========================================================
    // Helpers
    // ========================================================

    private static string GetValue(
        Dictionary<string, string> values,
        string key
    )
    {
        return values.TryGetValue(
            key,
            out var value
        )
            ? value
            : "";
    }


    private static string GetProcessFailureDetails(
        string stdout,
        string stderr,
        int exitCode
    )
    {
        var output =
            !string.IsNullOrWhiteSpace(
                stderr
            )
                ? stderr.Trim()
                : stdout.Trim();


        if (string.IsNullOrWhiteSpace(
            output
        ))
        {
            return
                $"Python exited with code {exitCode}.";
        }


        return
            $"Python exited with code {exitCode}: {output}";
    }
}