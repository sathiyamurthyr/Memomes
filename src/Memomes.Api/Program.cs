using Microsoft.EntityFrameworkCore;
using Memomes.Api.Data;
using Memomes.Api.Services;
using Memomes.Api.Workers;
using Memomes.Api.Middleware;
using Memomes.Api.Endpoints;
using Pgvector.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Database Connection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Database=memomes;Username=memomes_user;Password=memomes_secure_password_123";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString, o => o.UseVector());
});

// Storage Service, Audit Logger, Preview Generator & Object Key Generator
builder.Services.AddSingleton<IStorageIdentityService, StorageIdentityService>();
builder.Services.AddSingleton<IS3StorageService, S3StorageService>();
builder.Services.AddScoped<IAuditLoggerService, AuditLoggerService>();
builder.Services.AddSingleton<IPreviewGeneratorService, PreviewGeneratorService>();
builder.Services.AddSingleton<IObjectKeyGenerator, ObjectKeyGeneratorService>();
builder.Services.AddSingleton<ICacheService, InMemoryCacheService>();

// Cold Storage Archiver Worker
builder.Services.AddHostedService<ColdStorageArchiverWorker>();

// CORS Setup
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:6523",   // Memomes Client dev server
            "http://127.0.0.1:6523",
            "http://127.0.0.1:5173",
            "http://localhost:5000"
        )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowClient");

// Social Media Bot Interceptor Middleware
app.UseMiddleware<BotDefenseMiddleware>();

// Ensure Database & pgvector Extension Created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Could not run EnsureCreated automatically (PostgreSQL may be starting up).");
    }
}

// Register Minimal API Endpoints
app.MapGroup("/api/files").MapFilesEndpoints();
app.MapGroup("/api/embeddings").MapVectorEndpoints();
app.MapGroup("/api/sharing").MapSharingEndpoints();
app.MapGroup("/api/payments").MapBillingEndpoints();
app.MapGroup("/api/account").MapAccountEndpoints();
app.MapGroup("/api/audit").MapAuditEndpoints();

app.MapGet("/", () => Results.Ok(new { System = "Memomes Cloud Zero-Knowledge API", Version = "1.0.0-net8", Status = "Healthy" }));

app.Run();
