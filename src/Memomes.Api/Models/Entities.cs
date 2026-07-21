using System.ComponentModel.DataAnnotations;

namespace Memomes.Api.Models;

public class StoredFile
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string FileNameEncrypted { get; set; } = string.Empty;
    public string ContentTypeEncrypted { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string ContentHash { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string AccessTier { get; set; } = "FULL_CONTROL"; // VIEW_ONLY, READ_DOWNLOAD, FULL_CONTROL
    public bool IsColdStorage { get; set; } = false;
    public bool IsTrash { get; set; } = false;
    public DateTime? TrashCreatedAt { get; set; }
    public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<StoredFileVersion> Versions { get; set; } = new List<StoredFileVersion>();
    public ICollection<FileKeyEnvelope> Envelopes { get; set; } = new List<FileKeyEnvelope>();
}

public class StoredFileVersion
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FileId { get; set; }
    public StoredFile File { get; set; } = null!;
    public int VersionNumber { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string ContentHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class FileAccessLog
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? FileId { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty; // READ, DOWNLOAD, PRESIGN, SHARE, VAULT_LOCK, PURGE, ROLLBACK
    public string IpAddress { get; set; } = string.Empty;
    public string GeoLocation { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public double LatencyMs { get; set; }
}

public class UserSubscription
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string PlanTier { get; set; } = "FREE"; // FREE, PRO_SOLO, PRO_PLUS, FAMILY_VAULT
    public decimal PriceINR { get; set; } = 0;
    public long StorageLimitBytes { get; set; } = 5368709120; // 5 GB default
    public string? RazorpaySubscriptionId { get; set; }
    public string? RazorpayCustomerEmail { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddYears(100);
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class FileKeyEnvelope
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FileId { get; set; }
    public StoredFile File { get; set; } = null!;
    public Guid SenderUserId { get; set; }
    public Guid RecipientUserId { get; set; }
    public string EncryptedKeyEnvelope { get; set; } = string.Empty;
    public string AccessLevel { get; set; } = "READ_DOWNLOAD"; // VIEW_ONLY, READ_DOWNLOAD, FULL_CONTROL
    public string Status { get; set; } = "APPROVED"; // PENDING_APPROVAL, APPROVED, REJECTED
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class EncryptedEmbedding
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FileId { get; set; }
    public Guid UserId { get; set; }
    public string EncryptedMetadata { get; set; } = string.Empty;
    public Pgvector.Vector Embedding { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class OfflineAuditLog
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OfflineLogId { get; set; }
    public Guid UserId { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public DateTime LoggedAt { get; set; }
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
}

public class UserPublicKey
{
    [Key]
    public Guid UserId { get; set; }
    public string PublicKeyPem { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
