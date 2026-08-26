namespace PriceWatch.Api.Models;

public sealed record ScheduleRequest(
    bool Enabled,
    string Day,
    string Time,
    bool RunIfMissed
);

public sealed record ScheduleStatus(
    bool TaskExists,
    bool Enabled,
    string Day,
    string Time,
    bool RunIfMissed
);