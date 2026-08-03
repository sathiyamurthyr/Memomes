using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Memomes.Api.Data;
using Memomes.Api.Models;

namespace Memomes.Api.Endpoints;

public static class AuditEndpoints
{
    public static RouteGroupBuilder MapAuditEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/sync-offline-logs", SyncOfflineLogsAsync);
        group.MapGet("/logs/{userId:guid}", GetUserLogsAsync);

        return group;
    }

    public record OfflineLogEntryInput(
        Guid OfflineLogId,
        Guid UserId,
        string DeviceId,
        string Action,
        string Details,
        DateTime LoggedAt
    );

    public record SyncOfflineLogsInput(
        Guid UserId,
        List<OfflineLogEntryInput> LogEntries
    );

    private static async Task<IResult> SyncOfflineLogsAsync(
        [FromBody] SyncOfflineLogsInput input,
        [FromServices] AppDbContext db)
    {
        if (input.LogEntries == null || input.LogEntries.Count == 0)
        {
            return Results.Ok(new { ProcessedCount = 0, Message = "No logs provided" });
        }

        int insertedCount = 0;
        foreach (var entry in input.LogEntries)
        {
            // Idempotent Check: avoid duplicate inserts
            var exists = await db.OfflineAuditLogs.AnyAsync(l => l.OfflineLogId == entry.OfflineLogId);
            if (!exists)
            {
                var record = new OfflineAuditLog
                {
                    OfflineLogId = entry.OfflineLogId,
                    UserId = entry.UserId,
                    DeviceId = entry.DeviceId,
                    Action = entry.Action,
                    Details = entry.Details,
                    LoggedAt = entry.LoggedAt,
                    SyncedAt = DateTime.UtcNow
                };

                db.OfflineAuditLogs.Add(record);
                insertedCount++;
            }
        }

        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            Status = "SyncedIdempotently",
            ReceivedCount = input.LogEntries.Count,
            NewLogsInserted = insertedCount
        });
    }

    private static async Task<IResult> GetUserLogsAsync(
        Guid userId,
        AppDbContext db)
    {
        var logs = await db.FileAccessLogs
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.Timestamp)
            .Take(100)
            .Select(l => new
            {
                l.Id,
                l.FileId,
                l.Action,
                l.IpAddress,
                l.GeoLocation,
                l.Timestamp,
                l.LatencyMs
            })
            .ToListAsync();

        return Results.Ok(logs);
    }
}
