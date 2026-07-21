using System.Diagnostics;
using Memomes.Api.Data;
using Memomes.Api.Models;

namespace Memomes.Api.Services;

public interface IAuditLoggerService
{
    Task LogAccessAsync(Guid? fileId, Guid? userId, string action, HttpContext httpContext, Stopwatch stopwatch);
}

public class AuditLoggerService : IAuditLoggerService
{
    private readonly AppDbContext _db;
    private readonly ILogger<AuditLoggerService> _logger;

    public AuditLoggerService(AppDbContext db, ILogger<AuditLoggerService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task LogAccessAsync(Guid? fileId, Guid? userId, string action, HttpContext httpContext, Stopwatch stopwatch)
    {
        stopwatch.Stop();
        double latencyMs = stopwatch.Elapsed.TotalMilliseconds;

        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        if (httpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            ip = forwardedFor.FirstOrDefault()?.Split(',')[0].Trim() ?? ip;
        }

        var userAgent = httpContext.Request.Headers.UserAgent.ToString();
        var geoLocation = ResolveGeoLocation(ip);

        var log = new FileAccessLog
        {
            FileId = fileId,
            UserId = userId,
            Action = action,
            IpAddress = ip,
            GeoLocation = geoLocation,
            UserAgent = userAgent,
            Timestamp = DateTime.UtcNow,
            LatencyMs = latencyMs
        };

        _db.FileAccessLogs.Add(log);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Audit Logged: Action={Action}, IP={IP}, Geo={Geo}, Latency={Latency}ms",
            action, ip, geoLocation, latencyMs.ToString("F3"));
    }

    private string ResolveGeoLocation(string ip)
    {
        // Geo-IP Lookup implementation (mock/fallback for local dev IPs, Mumbai India default for demonstration)
        if (ip == "127.0.0.1" || ip == "::1" || ip.StartsWith("192.168.") || ip.StartsWith("10."))
        {
            return "Local Network (India/Mumbai)";
        }
        return "Mumbai, MH, India";
    }
}
