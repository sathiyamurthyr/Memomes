namespace Memomes.Api.Middleware;

public class BotDefenseMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly HashSet<string> BotUserAgents = new(StringComparer.OrdinalIgnoreCase)
    {
        "WhatsApp", "facebookexternalhit", "Twitterbot", "LinkedInBot", "TelegramBot", "Discordbot", "Slackbot"
    };

    public BotDefenseMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var userAgent = context.Request.Headers.UserAgent.ToString();

        if (IsSocialBot(userAgent))
        {
            context.Response.ContentType = "text/html; charset=utf-8";
            context.Response.StatusCode = 200;

            var html = @"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <title>Memomes Cloud - Zero-Knowledge Encrypted Shared Vault</title>
    <meta property=""og:title"" content=""Memomes Cloud - Zero-Knowledge Encrypted Shared Storage"">
    <meta property=""og:description"" content=""End-to-End Encrypted File Shared via Memomes Cloud. Open in browser to decrypt locally."">
    <meta property=""og:image"" content=""https://memomes.com/og-banner.png"">
    <meta property=""og:type"" content=""website"">
    <meta name=""twitter:card"" content=""summary_large_image"">
    <meta name=""twitter:title"" content=""Memomes Cloud Shared Vault"">
    <meta name=""twitter:description"" content=""End-to-End Encrypted File Shared via Memomes Cloud."">
</head>
<body style=""background-color: #0B0F17; color: #FFFFFF; font-family: sans-serif; text-align: center; padding: 50px;"">
    <h1>Memomes Cloud - Zero-Knowledge Vault</h1>
    <p>This file is protected with AES-256-GCM Zero-Knowledge Encryption. Please open the link in a web browser to decrypt content.</p>
</body>
</html>";
            await context.Response.WriteAsync(html);
            return;
        }

        await _next(context);
    }

    private static bool IsSocialBot(string userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent)) return false;

        foreach (var bot in BotUserAgents)
        {
            if (userAgent.Contains(bot, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }
        return false;
    }
}
