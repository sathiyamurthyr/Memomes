using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Memomes.Api.Data;
using Memomes.Api.Models;

namespace Memomes.Api.Endpoints;

public static class BillingEndpoints
{
    public static RouteGroupBuilder MapBillingEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/plans", GetPricingPlans);
        group.MapGet("/subscription/{userId:guid}", GetUserSubscriptionAsync);
        group.MapPost("/razorpay-webhook", HandleRazorpayWebhookAsync);

        return group;
    }

    private static IResult GetPricingPlans()
    {
        var plans = new[]
        {
            new { PlanTier = "FREE", Name = "Free Vault", StorageGB = 5, PriceINR = 0, AnnualPriceINR = 0, Period = "Monthly", Features = new[] { "5 GB ZK Storage", "Web & PWA Access", "Sub-5ms Search" } },
            new { PlanTier = "PRO_SOLO", Name = "Pro Solo", StorageGB = 100, PriceINR = 149, AnnualPriceINR = 1490, Period = "Monthly", Features = new[] { "100 GB ZK Storage", "Large Video Streaming", "Social Recovery (SSSS)", "Dynamic Watermarking" } },
            new { PlanTier = "PRO_PLUS", Name = "Pro Plus", StorageGB = 500, PriceINR = 399, AnnualPriceINR = 3990, Period = "Monthly", Features = new[] { "500 GB ZK Storage", "All Pro Solo Features", "Priority Multi-threading", "24/7 Priority Support" } },
            new { PlanTier = "FAMILY_VAULT", Name = "Family Vault", StorageGB = 1000, PriceINR = 699, AnnualPriceINR = 6990, Period = "Monthly", Features = new[] { "1 TB ZK Storage", "5 Isolated Member Accounts", "Family Key Recovery", "Dynamic Anti-Leak Watermark" } }
        };

        return Results.Ok(plans);
    }

    private static async Task<IResult> GetUserSubscriptionAsync(
        Guid userId,
        AppDbContext db)
    {
        var sub = await db.UserSubscriptions.FirstOrDefaultAsync(s => s.UserId == userId);
        if (sub == null)
        {
            sub = new UserSubscription
            {
                UserId = userId,
                PlanTier = "FREE",
                PriceINR = 0,
                StorageLimitBytes = 5L * 1024 * 1024 * 1024, // 5 GB
                IsActive = true,
                ExpiresAt = DateTime.UtcNow.AddYears(100)
            };
            db.UserSubscriptions.Add(sub);
            await db.SaveChangesAsync();
        }

        var usedBytes = await db.StoredFiles.Where(f => f.UserId == userId && !f.IsTrash).SumAsync(f => f.SizeBytes);

        return Results.Ok(new
        {
            sub.UserId,
            sub.PlanTier,
            sub.PriceINR,
            sub.StorageLimitBytes,
            UsedStorageBytes = usedBytes,
            StorageUsedPercentage = Math.Round((double)usedBytes / sub.StorageLimitBytes * 100, 2),
            sub.RazorpaySubscriptionId,
            sub.IsActive,
            sub.ExpiresAt
        });
    }

    private static async Task<IResult> HandleRazorpayWebhookAsync(
        HttpContext context,
        AppDbContext db,
        ILoggerFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger("RazorpayWebhook");

        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();

        logger.LogInformation("Received Razorpay Webhook Payload: {Body}", body);

        try
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            var eventType = root.GetProperty("event").GetString();

            if (eventType == "subscription.charged" || eventType == "payment.captured")
            {
                var payload = root.GetProperty("payload");

                string? subscriptionId = null;
                string? customerEmail = null;

                if (payload.TryGetProperty("subscription", out var subProp))
                {
                    subscriptionId = subProp.GetProperty("entity").GetProperty("id").GetString();
                }

                if (payload.TryGetProperty("payment", out var payProp))
                {
                    customerEmail = payProp.GetProperty("entity").GetProperty("email").GetString();
                }

                if (!string.IsNullOrEmpty(subscriptionId))
                {
                    var subscription = await db.UserSubscriptions
                        .FirstOrDefaultAsync(s => s.RazorpaySubscriptionId == subscriptionId || s.RazorpayCustomerEmail == customerEmail);

                    if (subscription != null)
                    {
                        subscription.IsActive = true;
                        subscription.ExpiresAt = DateTime.UtcNow.AddDays(31); // Extend for 31 days upon recurring charge
                        await db.SaveChangesAsync();

                        logger.LogInformation("Successfully renewed subscription {SubscriptionId} until {ExpiresAt}", subscriptionId, subscription.ExpiresAt);
                    }
                }
            }

            return Results.Ok(new { Status = "Processed", Event = eventType });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Razorpay webhook");
            return Results.Ok(new { Status = "ReceivedWithError", Message = ex.Message });
        }
    }
}
