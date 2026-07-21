using System.Text;

namespace Memomes.Api.Services;

public interface IPreviewGeneratorService
{
    Task<string> GenerateAndCachePreviewAsync(Guid fileId, string fileName, string contentType, byte[]? sampleBytes);
    Task<byte[]?> GetCachedPreviewAsync(Guid fileId);
}

public class PreviewGeneratorService : IPreviewGeneratorService
{
    private readonly IS3StorageService _s3Storage;
    private readonly ILogger<PreviewGeneratorService> _logger;
    private static readonly Dictionary<Guid, byte[]> LocalPreviewCache = new();

    public PreviewGeneratorService(IS3StorageService s3Storage, ILogger<PreviewGeneratorService> logger)
    {
        _s3Storage = s3Storage;
        _logger = logger;
    }

    public async Task<string> GenerateAndCachePreviewAsync(Guid fileId, string fileName, string contentType, byte[]? sampleBytes)
    {
        await Task.CompletedTask;
        _logger.LogInformation("Generating backend preview thumbnail for {FileId} ({FileName})", fileId, fileName);

        // Generate SVG or Data URI preview thumbnail based on file type
        string previewDataUri;

        if (contentType.StartsWith("image/") || fileName.EndsWith(".jpg") || fileName.EndsWith(".png"))
        {
            previewDataUri = "data:image/svg+xml;utf8," + Uri.EscapeDataString(
                $"<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='#10141F'/><circle cx='100' cy='90' r='40' fill='#A00D3A' opacity='0.8'/><text x='100' y='160' fill='#FFC928' font-size='12' font-family='sans-serif' text-anchor='middle'>Image Preview</text></svg>"
            );
        }
        else if (contentType.StartsWith("video/") || fileName.EndsWith(".mp4"))
        {
            previewDataUri = "data:image/svg+xml;utf8," + Uri.EscapeDataString(
                $"<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='#10141F'/><polygon points='85,70 130,100 85,130' fill='#FFC928'/><text x='100' y='165' fill='#E2E8F0' font-size='11' font-family='sans-serif' text-anchor='middle'>Video Frame 1</text></svg>"
            );
        }
        else if (contentType.Contains("pdf") || fileName.EndsWith(".pdf"))
        {
            previewDataUri = "data:image/svg+xml;utf8," + Uri.EscapeDataString(
                $"<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='#10141F'/><rect x='40' y='30' width='120' height='140' rx='8' fill='#1E263B' stroke='#3B82F6' stroke-width='2'/><text x='100' y='105' fill='#3B82F6' font-size='14' font-weight='bold' font-family='sans-serif' text-anchor='middle'>PDF Page 1</text></svg>"
            );
        }
        else if (fileName.EndsWith(".docx") || fileName.EndsWith(".pptx") || fileName.EndsWith(".xlsx"))
        {
            previewDataUri = "data:image/svg+xml;utf8," + Uri.EscapeDataString(
                $"<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='#10141F'/><rect x='45' y='35' width='110' height='130' rx='6' fill='#161C2C' stroke='#FFC928' stroke-width='2'/><text x='100' y='105' fill='#FFC928' font-size='12' font-weight='bold' font-family='sans-serif' text-anchor='middle'>Office Doc</text></svg>"
            );
        }
        else
        {
            previewDataUri = "data:image/svg+xml;utf8," + Uri.EscapeDataString(
                $"<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='#10141F'/><circle cx='100' cy='95' r='35' fill='#10B981' opacity='0.4'/><text x='100' y='100' fill='#10B981' font-size='16' font-weight='bold' font-family='sans-serif' text-anchor='middle'>ZIP Archive</text></svg>"
            );
        }

        byte[] previewBytes = Encoding.UTF8.GetBytes(previewDataUri);
        LocalPreviewCache[fileId] = previewBytes;

        return previewDataUri;
    }

    public async Task<byte[]?> GetCachedPreviewAsync(Guid fileId)
    {
        await Task.CompletedTask;
        if (LocalPreviewCache.TryGetValue(fileId, out var cachedBytes))
        {
            return cachedBytes;
        }
        return null;
    }
}
