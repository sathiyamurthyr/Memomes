namespace Memomes.Api.Services;

public enum WorkspaceType
{
    Personal,
    Business,
    Enterprise
}

public record ObjectKeyRequest(
    string? WorkspaceType = null,
    string? WorkspaceId = null,
    string? TenantId = null,
    string? CompanyId = null,
    Guid? UserId = null,
    string OriginalFileName = "",
    string? ContentType = null,
    DateTime? Date = null
);

public record ObjectKeyGenerationResult(
    WorkspaceType WorkspaceType,
    string WorkspaceId,
    string? TenantId,
    string? CompanyId,
    string UserId,
    string FileType,
    string Year,
    string Month,
    string Day,
    string EncryptedObjectId,
    string StorageObjectName,
    string ObjectKey,
    string OriginalFileName,
    string B2BucketName
);

public interface IObjectKeyGenerator
{
    ObjectKeyGenerationResult GenerateObjectKey(ObjectKeyRequest request);
    WorkspaceType DetectWorkspaceType(ObjectKeyRequest request);
    string ClassifyFileType(string? contentType, string fileName);
}

public class ObjectKeyGeneratorService : IObjectKeyGenerator
{
    private const string DefaultBucket = "sathus-memomes-vault";
    private const string BasePrefix = "sathus/memomes";
    private readonly IStorageIdentityService _identityService;

    public ObjectKeyGeneratorService(IStorageIdentityService identityService)
    {
        _identityService = identityService;
    }

    public WorkspaceType DetectWorkspaceType(ObjectKeyRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.WorkspaceType))
        {
            if (Enum.TryParse<WorkspaceType>(request.WorkspaceType, true, out var parsed))
            {
                return parsed;
            }
        }

        if (!string.IsNullOrWhiteSpace(request.TenantId) || !string.IsNullOrWhiteSpace(request.CompanyId))
        {
            return WorkspaceType.Business;
        }

        return WorkspaceType.Personal;
    }

    public string ClassifyFileType(string? contentType, string fileName)
    {
        var ext = fileName.Split('.').LastOrDefault()?.ToLower() ?? "";
        var mime = (contentType ?? "").ToLower();

        if (ext == "pdf" || mime.Contains("pdf")) return "PDF";
        if (mime.StartsWith("image/") || new[] { "png", "jpg", "jpeg", "webp", "svg", "gif", "bmp", "ico", "avif", "heic", "tiff" }.Contains(ext)) return "Images";
        if (mime.StartsWith("video/") || new[] { "mp4", "mov", "mkv", "webm", "avi", "m4v", "flv", "wmv", "3gp" }.Contains(ext)) return "Videos";
        if (mime.StartsWith("audio/") || new[] { "mp3", "wav", "aac", "flac", "ogg", "m4a", "wma", "aiff" }.Contains(ext)) return "Audio";
        if (mime.Contains("spreadsheet") || mime.Contains("excel") || mime.Contains("csv") || new[] { "xlsx", "xls", "csv", "ods" }.Contains(ext)) return "Spreadsheets";
        if (mime.Contains("presentation") || mime.Contains("powerpoint") || new[] { "pptx", "ppt", "key" }.Contains(ext)) return "Presentations";
        if (mime.Contains("word") || mime.Contains("document") || mime.Contains("text/plain") || new[] { "doc", "docx", "txt", "rtf", "md" }.Contains(ext)) return "Documents";
        if (mime.Contains("zip") || mime.Contains("compressed") || mime.Contains("archive") || new[] { "zip", "rar", "7z", "tar", "gz" }.Contains(ext)) return "Archives";
        if (new[] { "ts", "tsx", "js", "jsx", "cs", "py", "java", "cpp", "c", "h", "html", "css", "json", "sql", "xml", "yaml", "yml" }.Contains(ext)) return "SourceCode";

        return "Others";
    }

    public ObjectKeyGenerationResult GenerateObjectKey(ObjectKeyRequest request)
    {
        var type = DetectWorkspaceType(request);
        var workspaceId = _identityService.SanitizeStorageId("wrk", request.WorkspaceId);
        var userId = _identityService.SanitizeStorageId("usr", request.UserId?.ToString());
        var fileType = ClassifyFileType(request.ContentType, request.OriginalFileName);

        var now = request.Date ?? DateTime.UtcNow;
        var year = now.ToString("yyyy");
        var month = now.ToString("MM");
        var day = now.ToString("dd");

        // Permanent immutable Storage Object ID (obj_<ULID>)
        var encryptedObjectId = _identityService.GenerateObjectId();
        var storageObjectName = $"{encryptedObjectId}.enc";

        string objectKey;

        if (type == WorkspaceType.Personal)
        {
            // Personal Format: sathus/memomes/{workspaceStorageId}/{userStorageId}/{fileType}/{YYYY}/{MM}/{DD}/{objectStorageId}.enc
            objectKey = $"{BasePrefix}/{workspaceId}/{userId}/{fileType}/{year}/{month}/{day}/{storageObjectName}";
        }
        else
        {
            // Business/Enterprise Format: sathus/memomes/{workspaceStorageId}/{tenantId}/{companyId}/{userStorageId}/{fileType}/{YYYY}/{MM}/{DD}/{objectStorageId}.enc
            var tenantId = string.IsNullOrWhiteSpace(request.TenantId) ? "tenant001" : request.TenantId.ToLower().Trim();
            var companyId = string.IsNullOrWhiteSpace(request.CompanyId) ? "company001" : request.CompanyId.ToLower().Trim();
            objectKey = $"{BasePrefix}/{workspaceId}/{tenantId}/{companyId}/{userId}/{fileType}/{year}/{month}/{day}/{storageObjectName}";
        }

        return new ObjectKeyGenerationResult(
            WorkspaceType: type,
            WorkspaceId: workspaceId,
            TenantId: request.TenantId,
            CompanyId: request.CompanyId,
            UserId: userId,
            FileType: fileType,
            Year: year,
            Month: month,
            Day: day,
            EncryptedObjectId: encryptedObjectId,
            StorageObjectName: storageObjectName,
            ObjectKey: objectKey,
            OriginalFileName: request.OriginalFileName,
            B2BucketName: DefaultBucket
        );
    }
}
