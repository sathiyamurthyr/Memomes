using Microsoft.EntityFrameworkCore;
using Memomes.Api.Data;
using Memomes.Api.Models;

namespace Memomes.Api.Services;

public interface IWorkspaceService
{
    Task<UserWorkspace> GetOrCreatePersonalWorkspaceAsync(Guid userId, string? workspaceType = "PERSONAL");
}

public class WorkspaceService : IWorkspaceService
{
    private readonly AppDbContext _db;
    private readonly IStorageIdentityService _identityService;
    private readonly ILogger<WorkspaceService> _logger;

    public WorkspaceService(AppDbContext db, IStorageIdentityService identityService, ILogger<WorkspaceService> logger)
    {
        _db = db;
        _identityService = identityService;
        _logger = logger;
    }

    public async Task<UserWorkspace> GetOrCreatePersonalWorkspaceAsync(Guid userId, string? workspaceType = "PERSONAL")
    {
        var type = string.IsNullOrWhiteSpace(workspaceType) ? "PERSONAL" : workspaceType.ToUpperInvariant();

        // 1. Read existing permanent workspace from database
        var existing = await _db.UserWorkspaces
            .FirstOrDefaultAsync(w => w.UserId == userId);

        if (existing != null)
        {
            _logger.LogInformation("✅ Reusing existing permanent workspace {WorkspaceStorageId} for user {UserId}", existing.WorkspaceStorageId, userId);
            return existing;
        }

        // 2. Generate workspaceStorageId and userStorageId ONLY ONCE if workspace does not exist
        var newWorkspace = new UserWorkspace
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            WorkspaceStorageId = _identityService.GenerateWorkspaceId(),
            UserStorageId = _identityService.GenerateUserId(),
            WorkspaceType = type,
            CountryCode = "IN",
            TenantId = type == "ENTERPRISE" ? "tenant001" : null,
            CompanyId = type == "ENTERPRISE" ? "company001" : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            _db.UserWorkspaces.Add(newWorkspace);
            await _db.SaveChangesAsync();
            _logger.LogInformation("✨ Created & persisted single permanent workspace {WorkspaceStorageId} for user {UserId}", newWorkspace.WorkspaceStorageId, userId);
            return newWorkspace;
        }
        catch (DbUpdateException ex)
        {
            // Database constraint violation if duplicate attempt tried to create a 2nd workspace for same user!
            _logger.LogError(ex, "❌ Upload attempt tried to create a second workspace for the same personal account user {UserId}. Duplicate blocked by database constraint.", userId);

            // Fetch and return the single existing workspace
            var fallback = await _db.UserWorkspaces.FirstOrDefaultAsync(w => w.UserId == userId);
            if (fallback != null)
            {
                return fallback;
            }

            throw;
        }
    }
}
