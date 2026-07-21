using Microsoft.EntityFrameworkCore;
using Memomes.Api.Models;
using Pgvector;

namespace Memomes.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<StoredFile> StoredFiles => Set<StoredFile>();
    public DbSet<StoredFileVersion> StoredFileVersions => Set<StoredFileVersion>();
    public DbSet<FileAccessLog> FileAccessLogs => Set<FileAccessLog>();
    public DbSet<UserSubscription> UserSubscriptions => Set<UserSubscription>();
    public DbSet<FileKeyEnvelope> FileKeyEnvelopes => Set<FileKeyEnvelope>();
    public DbSet<EncryptedEmbedding> EncryptedEmbeddings => Set<EncryptedEmbedding>();
    public DbSet<OfflineAuditLog> OfflineAuditLogs => Set<OfflineAuditLog>();
    public DbSet<UserPublicKey> UserPublicKeys => Set<UserPublicKey>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Register pgvector extension
        modelBuilder.HasPostgresExtension("vector");

        // StoredFile indexes
        modelBuilder.Entity<StoredFile>()
            .HasIndex(f => f.UserId);
        modelBuilder.Entity<StoredFile>()
            .HasIndex(f => f.ContentHash);
        modelBuilder.Entity<StoredFile>()
            .HasIndex(f => f.LastAccessedAt);

        // StoredFileVersion relationship
        modelBuilder.Entity<StoredFileVersion>()
            .HasOne(v => v.File)
            .WithMany(f => f.Versions)
            .HasForeignKey(v => v.FileId)
            .OnDelete(DeleteBehavior.Cascade);

        // FileKeyEnvelope relationship
        modelBuilder.Entity<FileKeyEnvelope>()
            .HasOne(e => e.File)
            .WithMany(f => f.Envelopes)
            .HasForeignKey(e => e.FileId)
            .OnDelete(DeleteBehavior.Cascade);

        // Vector Embedding indexing
        modelBuilder.Entity<EncryptedEmbedding>()
            .HasIndex(e => e.UserId);
        modelBuilder.Entity<EncryptedEmbedding>()
            .HasIndex(e => e.FileId);

        // UserSubscription indexing
        modelBuilder.Entity<UserSubscription>()
            .HasIndex(s => s.UserId)
            .IsUnique();

        // Offline Audit Log indexing
        modelBuilder.Entity<OfflineAuditLog>()
            .HasIndex(l => l.OfflineLogId)
            .IsUnique();
    }
}
