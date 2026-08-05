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
    public string FileHashSha256 { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string AccessTier { get; set; } = "FULL_CONTROL"; // VIEW_ONLY, READ_DOWNLOAD, FULL_CONTROL
    public bool IsColdStorage { get; set; } = false;
    public bool IsTrash { get; set; } = false;
    public DateTime? TrashCreatedAt { get; set; }
    public int VersionNumber { get; set; } = 1;
    public Guid? ParentFileId { get; set; }
    public Guid? DuplicateOfId { get; set; }
    public bool IsLatest { get; set; } = true;
    public int UploadCount { get; set; } = 1;
    public DateTime LastUploadedAt { get; set; } = DateTime.UtcNow;
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

// ─────────────────────────────────────────────────────────────────────────────
// MEMOMES CLOUD V2 PURE OBJECT STORAGE & METADATA ENTITIES
// ─────────────────────────────────────────────────────────────────────────────

public class StorageObject
{
    [Key]
    public Guid StorageObjectId { get; set; } = Guid.NewGuid();
    public string ObjectId { get; set; } = string.Empty; // e.g. obj_01K5F7VJX8M2Q4R6N9ABCD1234
    public string ObjectKey { get; set; } = string.Empty; // e.g. objects/obj_01K5F7VJX8M2Q4R6N9ABCD1234.enc
    public string BucketName { get; set; } = "sathus-memomes-vault";
    public string Provider { get; set; } = "Backblaze B2";
    public long EncryptedSize { get; set; }
    public string ChecksumSha256 { get; set; } = string.Empty;
    public string ChecksumSha1 { get; set; } = string.Empty;
    public string EncryptionAlgorithm { get; set; } = "AES-256-GCM Zero-Knowledge";
    public string StorageClass { get; set; } = "STANDARD";
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class FileMetadata
{
    [Key]
    public Guid FileId { get; set; } = Guid.NewGuid();
    public string TenantId { get; set; } = "tenant001";
    public string CompanyId { get; set; } = "company001";
    public string WorkspaceId { get; set; } = "workspace001";
    public Guid OwnerUserId { get; set; }
    public Guid? FolderId { get; set; }
    public Guid StorageObjectId { get; set; }
    public StorageObject? StorageObject { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string MimeType { get; set; } = "application/octet-stream";
    public string Extension { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public Guid? ThumbnailObjectId { get; set; }
    public Guid? PreviewObjectId { get; set; }
    public string AiIndexStatus { get; set; } = "COMPLETED";
    public string VirusScanStatus { get; set; } = "CLEAN";
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Folder
{
    [Key]
    public Guid FolderId { get; set; } = Guid.NewGuid();
    public string TenantId { get; set; } = "tenant001";
    public string CompanyId { get; set; } = "company001";
    public string WorkspaceId { get; set; } = "workspace001";
    public Guid? ParentFolderId { get; set; }
    public string FolderName { get; set; } = string.Empty;
    public string FolderPath { get; set; } = string.Empty;
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ShareLink
{
    [Key]
    public Guid ShareId { get; set; } = Guid.NewGuid();
    public string ShareCode { get; set; } = string.Empty;
    public Guid FileId { get; set; }
    public string? PasswordHash { get; set; }
    public DateTime? Expiry { get; set; }
    public int? ViewLimit { get; set; }
    public bool DownloadPermission { get; set; } = true;
    public bool Watermark { get; set; } = false;
    public bool OtpRequired { get; set; } = false;
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class UserWorkspace
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string WorkspaceStorageId { get; set; } = string.Empty; // e.g. wrk_01J...
    public string UserStorageId { get; set; } = string.Empty;      // e.g. usr_01J...
    public string WorkspaceType { get; set; } = "PERSONAL";         // PERSONAL, BUSINESS, ENTERPRISE
    public string CountryCode { get; set; } = "IN";                 // e.g. IN, US
    public string? TenantId { get; set; }
    public string? CompanyId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

