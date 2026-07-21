using Microsoft.EntityFrameworkCore;
using Memomes.Api.Data;
using Memomes.Api.Models;

namespace Memomes.Api.Endpoints;

public static class SharingEndpoints
{
    public static RouteGroupBuilder MapSharingEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/public-key", SavePublicKeyAsync);
        group.MapGet("/public-key/{userId:guid}", GetPublicKeyAsync);
        group.MapPost("/envelope", CreateEnvelopeAsync);
        group.MapGet("/envelopes/{userId:guid}", GetUserEnvelopesAsync);
        group.MapPost("/reshare-request", CreateReshareRequestAsync);
        group.MapPost("/reshare-approve", ApproveReshareRequestAsync);

        return group;
    }

    public record SavePublicKeyInput(Guid UserId, string PublicKeyPem);
    public record CreateEnvelopeInput(
        Guid FileId,
        Guid SenderUserId,
        Guid RecipientUserId,
        string EncryptedKeyEnvelope,
        string AccessLevel = "READ_DOWNLOAD"
    );

    public record ReshareRequestInput(Guid FileId, Guid RequesterUserId, Guid TargetRecipientUserId);
    public record ReshareApproveInput(Guid EnvelopeId, Guid OwnerUserId, string EncryptedKeyEnvelopeForRecipient);

    private static async Task<IResult> SavePublicKeyAsync(
        SavePublicKeyInput input,
        AppDbContext db)
    {
        var existing = await db.UserPublicKeys.FindAsync(input.UserId);
        if (existing != null)
        {
            existing.PublicKeyPem = input.PublicKeyPem;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            db.UserPublicKeys.Add(new UserPublicKey
            {
                UserId = input.UserId,
                PublicKeyPem = input.PublicKeyPem,
                UpdatedAt = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync();
        return Results.Ok(new { Status = "Registered", UserId = input.UserId });
    }

    private static async Task<IResult> GetPublicKeyAsync(
        Guid userId,
        AppDbContext db)
    {
        var record = await db.UserPublicKeys.FindAsync(userId);
        if (record == null)
        {
            return Results.NotFound(new { Error = "Public key not found for user" });
        }
        return Results.Ok(new { UserId = userId, PublicKeyPem = record.PublicKeyPem });
    }

    private static async Task<IResult> CreateEnvelopeAsync(
        CreateEnvelopeInput input,
        AppDbContext db)
    {
        var file = await db.StoredFiles.FindAsync(input.FileId);
        if (file == null) return Results.NotFound(new { Error = "File not found" });

        var envelope = new FileKeyEnvelope
        {
            FileId = input.FileId,
            SenderUserId = input.SenderUserId,
            RecipientUserId = input.RecipientUserId,
            EncryptedKeyEnvelope = input.EncryptedKeyEnvelope,
            AccessLevel = input.AccessLevel,
            Status = "APPROVED",
            CreatedAt = DateTime.UtcNow
        };

        db.FileKeyEnvelopes.Add(envelope);
        await db.SaveChangesAsync();

        return Results.Ok(new { EnvelopeId = envelope.Id, Status = "Shared", AccessLevel = envelope.AccessLevel });
    }

    private static async Task<IResult> GetUserEnvelopesAsync(
        Guid userId,
        AppDbContext db)
    {
        var envelopes = await db.FileKeyEnvelopes
            .Include(e => e.File)
            .Where(e => e.RecipientUserId == userId && e.Status == "APPROVED")
            .Select(e => new
            {
                e.Id,
                e.FileId,
                e.SenderUserId,
                e.EncryptedKeyEnvelope,
                e.AccessLevel,
                e.File.FileNameEncrypted,
                e.File.SizeBytes,
                e.CreatedAt
            })
            .ToListAsync();

        return Results.Ok(envelopes);
    }

    private static async Task<IResult> CreateReshareRequestAsync(
        ReshareRequestInput input,
        AppDbContext db)
    {
        var file = await db.StoredFiles.FindAsync(input.FileId);
        if (file == null) return Results.NotFound(new { Error = "File not found" });

        var envelope = new FileKeyEnvelope
        {
            FileId = input.FileId,
            SenderUserId = input.RequesterUserId,
            RecipientUserId = input.TargetRecipientUserId,
            EncryptedKeyEnvelope = string.Empty, // Awaiting owner re-encryption upon approval
            AccessLevel = "READ_DOWNLOAD",
            Status = "PENDING_APPROVAL",
            CreatedAt = DateTime.UtcNow
        };

        db.FileKeyEnvelopes.Add(envelope);
        await db.SaveChangesAsync();

        return Results.Ok(new { EnvelopeId = envelope.Id, Status = "PendingOwnerApproval", OwnerUserId = file.UserId });
    }

    private static async Task<IResult> ApproveReshareRequestAsync(
        ReshareApproveInput input,
        AppDbContext db)
    {
        var envelope = await db.FileKeyEnvelopes.Include(e => e.File).FirstOrDefaultAsync(e => e.Id == input.EnvelopeId);
        if (envelope == null) return Results.NotFound(new { Error = "Reshare request not found" });

        if (envelope.File.UserId != input.OwnerUserId)
        {
            return Results.Problem("Only the original file owner can approve reshare requests", statusCode: 403);
        }

        envelope.EncryptedKeyEnvelope = input.EncryptedKeyEnvelopeForRecipient;
        envelope.Status = "APPROVED";
        await db.SaveChangesAsync();

        return Results.Ok(new { EnvelopeId = envelope.Id, Status = "Approved" });
    }
}
