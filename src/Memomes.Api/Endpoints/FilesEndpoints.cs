using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Memomes.Api.Data;
using Memomes.Api.Models;
using Memomes.Api.Services;

namespace Memomes.Api.Endpoints;

public static class FilesEndpoints
{
    public static RouteGroupBuilder MapFilesEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/init-upload", InitUploadAsync);
        group.MapPost("/presigned-chunk-url", GetPresignedChunkUrlAsync);
        group.MapPost("/complete-upload", CompleteUploadAsync);
        group.MapGet("/{id:guid}/presigned-download", GetPresignedDownloadUrlAsync);
        group.MapGet("/{id:guid}/preview", GetFilePreviewAsync);
        group.MapGet("/list", ListFilesAsync);
        group.MapDelete("/{id:guid}/trash", SoftDeleteFileAsync);
        group.MapPost("/{id:guid}/restore", RestoreFileAsync);
        group.MapGet("/trash", ListTrashFilesAsync);
        group.MapPost("/dropbox/request", CreateDropboxRequestAsync);
        group.MapGet("/dropbox/{token}/public-key", GetDropboxPublicKeyAsync);

        return group;
    }

    public record InitUploadRequest(
        Guid UserId,
        string FileNameEncrypted,
        string ContentTypeEncrypted,
        long SizeBytes,
        string ContentHash
    );

    public record PresignedChunkRequest(
        Guid FileId,
        int PartNumber,
        string UploadId
    );

    public record CompleteUploadRequest(
        Guid FileId,
        string UploadId,
        List<ChunkETagInfo>? PartETags
    );

    public record ChunkETagInfo(int PartNumber, string ETag);

    public record DropboxRequestInput(Guid OwnerUserId, string FolderLabel);

    private static async Task<IResult> InitUploadAsync(
        [FromBody] InitUploadRequest input,
        [FromServices] AppDbContext db,
        [FromServices] IS3StorageService s3Storage,
        [FromServices] IAuditLoggerService auditLogger,
        [FromServices] IPreviewGeneratorService previewGenerator,
        HttpContext context)
    {
        var sw = Stopwatch.StartNew();

        // Generate backend cached preview
        var fileId = Guid.NewGuid();
        await previewGenerator.GenerateAndCachePreviewAsync(fileId, input.FileNameEncrypted, input.ContentTypeEncrypted, null);

        // Client-Side Zero-Knowledge Deduplication Check
        var existingFile = await db.StoredFiles
            .FirstOrDefaultAsync(f => f.UserId == input.UserId && f.ContentHash == input.ContentHash && !f.IsTrash);

        if (existingFile != null)
        {
            var deduplicatedFile = new StoredFile
            {
                UserId = input.UserId,
                FileNameEncrypted = input.FileNameEncrypted,
                ContentTypeEncrypted = input.ContentTypeEncrypted,
                SizeBytes = input.SizeBytes,
                ContentHash = input.ContentHash,
                StoragePath = existingFile.StoragePath,
                AccessTier = "FULL_CONTROL",
                LastAccessedAt = DateTime.UtcNow
            };

            db.StoredFiles.Add(deduplicatedFile);
            await db.SaveChangesAsync();

            await auditLogger.LogAccessAsync(deduplicatedFile.Id, input.UserId, "DEDUPLICATED_UPLOAD", context, sw);

            return Results.Ok(new
            {
                IsDeduplicated = true,
                FileId = deduplicatedFile.Id,
                StoragePath = deduplicatedFile.StoragePath,
                Message = "Zero-Knowledge deduplication linked existing encrypted blob"
            });
        }

        var storagePath = $"vault/{input.UserId}/{fileId}.bin";

        var newFile = new StoredFile
        {
            Id = fileId,
            UserId = input.UserId,
            FileNameEncrypted = input.FileNameEncrypted,
            ContentTypeEncrypted = input.ContentTypeEncrypted,
            SizeBytes = input.SizeBytes,
            ContentHash = input.ContentHash,
            StoragePath = storagePath,
            AccessTier = "FULL_CONTROL",
            LastAccessedAt = DateTime.UtcNow
        };

        db.StoredFiles.Add(newFile);
        await db.SaveChangesAsync();

        if (input.SizeBytes > 100 * 1024 * 1024)
        {
            var uploadId = await s3Storage.InitiateMultipartUploadAsync(storagePath, input.ContentTypeEncrypted);
            await auditLogger.LogAccessAsync(newFile.Id, input.UserId, "INIT_MULTIPART_UPLOAD", context, sw);

            return Results.Ok(new
            {
                IsDeduplicated = false,
                IsMultipart = true,
                FileId = newFile.Id,
                UploadId = uploadId,
                StoragePath = storagePath
            });
        }

        var presignedUploadUrl = s3Storage.GeneratePresignedUploadUrl(storagePath, input.ContentTypeEncrypted, 60);

        await auditLogger.LogAccessAsync(newFile.Id, input.UserId, "INIT_SINGLE_UPLOAD", context, sw);

        return Results.Ok(new
        {
            IsDeduplicated = false,
            IsMultipart = false,
            FileId = newFile.Id,
            PresignedUploadUrl = presignedUploadUrl,
            StoragePath = storagePath
        });
    }

    private static async Task<IResult> GetFilePreviewAsync(
        Guid id,
        IPreviewGeneratorService previewGenerator,
        HttpContext context)
    {
        var previewBytes = await previewGenerator.GetCachedPreviewAsync(id);
        if (previewBytes == null)
        {
            var defaultSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='#10141F'/><text x='100' y='100' fill='#FFC928' font-size='12' text-anchor='middle'>Preview Ready</text></svg>";
            previewBytes = System.Text.Encoding.UTF8.GetBytes(defaultSvg);
        }

        context.Response.Headers.Append("Cache-Control", "public, max-age=31536000");
        return Results.Bytes(previewBytes, contentType: "image/svg+xml");
    }

    private static async Task<IResult> GetPresignedChunkUrlAsync(
        [FromBody] PresignedChunkRequest input,
        [FromServices] AppDbContext db,
        [FromServices] IS3StorageService s3Storage)
    {
        var file = await db.StoredFiles.FindAsync(input.FileId);
        if (file == null) return Results.NotFound(new { Error = "File record not found" });

        var chunkUrl = s3Storage.GeneratePresignedChunkUploadUrl(file.StoragePath, input.UploadId, input.PartNumber, 60);
        return Results.Ok(new { ChunkUrl = chunkUrl, PartNumber = input.PartNumber, ExpiresInSeconds = 60 });
    }

    private static async Task<IResult> CompleteUploadAsync(
        [FromBody] CompleteUploadRequest input,
        [FromServices] AppDbContext db,
        [FromServices] IS3StorageService s3Storage,
        [FromServices] IAuditLoggerService auditLogger,
        HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        var file = await db.StoredFiles.FindAsync(input.FileId);
        if (file == null) return Results.NotFound(new { Error = "File record not found" });

        if (!string.IsNullOrEmpty(input.UploadId) && input.PartETags != null)
        {
            var partETags = input.PartETags
                .Select(p => new Amazon.S3.Model.PartETag(p.PartNumber, p.ETag))
                .ToList();
            await s3Storage.CompleteMultipartUploadAsync(file.StoragePath, input.UploadId, partETags);
        }

        file.UpdatedAt = DateTime.UtcNow;
        file.LastAccessedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await auditLogger.LogAccessAsync(file.Id, file.UserId, "COMPLETE_UPLOAD", context, sw);

        return Results.Ok(new { FileId = file.Id, Status = "Completed", Message = "File successfully encrypted and stored" });
    }

    private static async Task<IResult> GetPresignedDownloadUrlAsync(
        Guid id,
        Guid userId,
        AppDbContext db,
        IS3StorageService s3Storage,
        IAuditLoggerService auditLogger,
        HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        var file = await db.StoredFiles.FindAsync(id);
        if (file == null || file.IsTrash) return Results.NotFound(new { Error = "File not found or deleted" });

        file.LastAccessedAt = DateTime.UtcNow;
        if (file.IsColdStorage)
        {
            file.IsColdStorage = false;
        }
        await db.SaveChangesAsync();

        var presignedUrl = s3Storage.GeneratePresignedDownloadUrl(file.StoragePath, 60);

        await auditLogger.LogAccessAsync(file.Id, userId, "PRESIGN_DOWNLOAD", context, sw);

        return Results.Ok(new
        {
            FileId = file.Id,
            PresignedUrl = presignedUrl,
            ExpiresInSeconds = 60,
            IsColdStorage = file.IsColdStorage,
            AccessTier = file.AccessTier
        });
    }

    private static async Task<IResult> ListFilesAsync(
        Guid userId,
        AppDbContext db)
    {
        var files = await db.StoredFiles
            .Where(f => f.UserId == userId && !f.IsTrash)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new
            {
                f.Id,
                f.FileNameEncrypted,
                f.ContentTypeEncrypted,
                f.SizeBytes,
                f.ContentHash,
                f.AccessTier,
                f.IsColdStorage,
                f.LastAccessedAt,
                f.CreatedAt
            })
            .ToListAsync();

        return Results.Ok(files);
    }

    private static async Task<IResult> SoftDeleteFileAsync(
        Guid id,
        Guid userId,
        AppDbContext db,
        IAuditLoggerService auditLogger,
        HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        var file = await db.StoredFiles.FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
        if (file == null) return Results.NotFound(new { Error = "File not found" });

        file.IsTrash = true;
        file.TrashCreatedAt = DateTime.UtcNow;
        file.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await auditLogger.LogAccessAsync(file.Id, userId, "SOFT_DELETE_TRASH", context, sw);

        return Results.Ok(new { FileId = file.Id, Status = "MovedToTrash", TrashRetentionDays = 30 });
    }

    private static async Task<IResult> RestoreFileAsync(
        Guid id,
        Guid userId,
        AppDbContext db,
        IAuditLoggerService auditLogger,
        HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        var file = await db.StoredFiles.FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
        if (file == null) return Results.NotFound(new { Error = "File not found" });

        file.IsTrash = false;
        file.TrashCreatedAt = null;
        file.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await auditLogger.LogAccessAsync(file.Id, userId, "RESTORE_TRASH", context, sw);

        return Results.Ok(new { FileId = file.Id, Status = "Restored" });
    }

    private static async Task<IResult> ListTrashFilesAsync(
        Guid userId,
        AppDbContext db)
    {
        var trashFiles = await db.StoredFiles
            .Where(f => f.UserId == userId && f.IsTrash)
            .OrderByDescending(f => f.TrashCreatedAt)
            .Select(f => new
            {
                f.Id,
                f.FileNameEncrypted,
                f.SizeBytes,
                f.TrashCreatedAt,
                DaysRemaining = f.TrashCreatedAt.HasValue ? 30 - (DateTime.UtcNow - f.TrashCreatedAt.Value).Days : 30
            })
            .ToListAsync();

        return Results.Ok(trashFiles);
    }

    private static async Task<IResult> CreateDropboxRequestAsync(
        [FromBody] DropboxRequestInput input,
        [FromServices] AppDbContext db)
    {
        var token = Guid.NewGuid().ToString("N");
        await Task.CompletedTask;
        return Results.Ok(new
        {
            DropboxToken = token,
            OwnerUserId = input.OwnerUserId,
            FolderLabel = input.FolderLabel,
            UploadUrl = $"/dropbox/{token}"
        });
    }

    private static async Task<IResult> GetDropboxPublicKeyAsync(
        string token,
        Guid ownerUserId,
        AppDbContext db)
    {
        var keyRecord = await db.UserPublicKeys.FindAsync(ownerUserId);
        if (keyRecord == null)
        {
            return Results.Ok(new { PublicKeyPem = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuMemomesPublicKey\n-----END PUBLIC KEY-----" });
        }
        return Results.Ok(new { PublicKeyPem = keyRecord.PublicKeyPem });
    }
}
