using Microsoft.EntityFrameworkCore;
using Memomes.Api.Data;
using Memomes.Api.Services;

namespace Memomes.Api.Workers;

public class ColdStorageArchiverWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ColdStorageArchiverWorker> _logger;

    public ColdStorageArchiverWorker(IServiceProvider serviceProvider, ILogger<ColdStorageArchiverWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ColdStorageArchiverWorker background service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessColdStorageArchivingAndTrashPurgeAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during Cold Storage Archiving execution.");
            }

            // Run daily (every 24 hours)
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    public async Task ProcessColdStorageArchivingAndTrashPurgeAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var s3Storage = scope.ServiceProvider.GetRequiredService<IS3StorageService>();

        var cutoffDate = DateTime.UtcNow.AddDays(-30);

        // 1. Flag files unaccessed for 30 days as IsColdStorage = true
        var coldCandidates = await db.StoredFiles
            .Where(f => !f.IsColdStorage && !f.IsTrash && f.LastAccessedAt < cutoffDate)
            .ToListAsync(cancellationToken);

        if (coldCandidates.Count > 0)
        {
            foreach (var file in coldCandidates)
            {
                file.IsColdStorage = true;
                file.UpdatedAt = DateTime.UtcNow;
            }
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Flagged {Count} files as Cold Storage (unaccessed for 30+ days).", coldCandidates.Count);
        }

        // 2. Permanently purge soft-deleted Trash files older than 30 days
        var trashPurgeCandidates = await db.StoredFiles
            .Where(f => f.IsTrash && f.TrashCreatedAt.HasValue && f.TrashCreatedAt.Value < cutoffDate)
            .ToListAsync(cancellationToken);

        if (trashPurgeCandidates.Count > 0)
        {
            var keysToDelete = trashPurgeCandidates.Select(f => f.StoragePath).Distinct().ToList();
            await s3Storage.DeleteObjectsBatchAsync(keysToDelete);

            db.StoredFiles.RemoveRange(trashPurgeCandidates);
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Purged {Count} files from Vault Trash (in trash for 30+ days).", trashPurgeCandidates.Count);
        }
    }
}
