namespace Memomes.Api.Services;

public enum WorkspaceType
{
    Personal,
    Business,
    Enterprise
}

public record ObjectKeyRequest(
    string? WorkspaceType = null,
    string? CountryCode = null,
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
    string CountryCode,
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
    private readonly ILogger<ObjectKeyGeneratorService> _logger;

    public ObjectKeyGeneratorService(IStorageIdentityService identityService, ILogger<ObjectKeyGeneratorService> logger)
    {
        _identityService = identityService;
        _logger = logger;
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
        var countryCode = string.IsNullOrWhiteSpace(request.CountryCode) ? "IN" : request.CountryCode.ToUpper().Trim();
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
        string? tenantId = null;
        string? companyId = null;

        if (type == WorkspaceType.Personal)
        {
            // Personal Standard: sathus/memomes/{countryCode}/personal/{workspaceStorageId}/{userStorageId}/{category}/{yyyy}/{MM}/{dd}/obj_xxxxxxxxx.enc
            objectKey = $"{BasePrefix}/{countryCode}/personal/{workspaceId}/{userId}/{fileType}/{year}/{month}/{day}/{storageObjectName}";
        }
        else
        {
            // Enterprise Standard: sathus/memomes/{countryCode}/enterprise/{tenantId}/{companyId}/{workspaceStorageId}/{userStorageId}/{category}/{yyyy}/{MM}/{dd}/obj_xxxxxxxxx.enc
            tenantId = string.IsNullOrWhiteSpace(request.TenantId) ? "tenant001" : request.TenantId.ToLower().Trim();
            companyId = string.IsNullOrWhiteSpace(request.CompanyId) ? "company001" : request.CompanyId.ToLower().Trim();
            objectKey = $"{BasePrefix}/{countryCode}/enterprise/{tenantId}/{companyId}/{workspaceId}/{userId}/{fileType}/{year}/{month}/{day}/{storageObjectName}";
        }

        _logger.LogInformation(
            "\n====== MEMOMES CLOUD STORAGE PATH GENERATED ======\nAccount Type : {Type}\nCountry      : {Country}\nWorkspace    : {WorkspaceId}\nUser         : {UserId}\nGenerated Path: {ObjectKey}\n==========================================",
            type.ToString().ToUpperInvariant(), countryCode, workspaceId, userId, objectKey);

        return new ObjectKeyGenerationResult(
            WorkspaceType: type,
            CountryCode: countryCode,
            WorkspaceId: workspaceId,
            TenantId: tenantId,
            CompanyId: companyId,
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
