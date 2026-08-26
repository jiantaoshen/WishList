namespace PriceWatch.Api.Models;

public sealed record EmailSettingsResponse(
    string SmtpHost,
    int SmtpPort,
    string SmtpUser,
    string EmailFrom,
    string EmailTo,
    bool HasPassword
);


public sealed record UpdateEmailSettingsRequest(
    string SmtpHost,
    int SmtpPort,
    string SmtpUser,
    string? SmtpPassword,
    string EmailFrom,
    string EmailTo
);


public sealed record EmailTestResult(
    bool Success,
    string Message
);