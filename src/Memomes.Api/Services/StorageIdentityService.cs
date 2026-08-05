using System.Security.Cryptography;
using System.Text;

namespace Memomes.Api.Services;

public interface IStorageIdentityService
{
    string GenerateWorkspaceId();
    string GenerateUserId();
    string GenerateFolderId();
    string GenerateObjectId();
    string GenerateThumbnailId();
    string GeneratePreviewId();
    string GenerateShareId();
    string SanitizeStorageId(string prefix, string? existingId);
}

public class StorageIdentityService : IStorageIdentityService
{
    private static readonly char[] Base32Chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".ToCharArray();

    private string GenerateUlid(string prefix)
    {
        // 10-digit Timestamp in milliseconds + 16 random Base32 characters = 26 char ULID format
        var nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var timeChars = new char[10];

        for (int i = 9; i >= 0; i--)
        {
            timeChars[i] = Base32Chars[nowMs % 32];
            nowMs /= 32;
        }

        var randomBytes = new byte[10];
        RandomNumberGenerator.Fill(randomBytes);

        var randomChars = new char[16];
        for (int i = 0; i < 16; i++)
        {
            randomChars[i] = Base32Chars[randomBytes[i] % 32];
        }

        var ulid = new string(timeChars) + new string(randomChars);
        return $"{prefix}_{ulid}";
    }

    public string GenerateWorkspaceId() => GenerateUlid("wrk");
    public string GenerateUserId() => GenerateUlid("usr");
    public string GenerateFolderId() => GenerateUlid("fld");
    public string GenerateObjectId() => GenerateUlid("obj");
    public string GenerateThumbnailId() => GenerateUlid("thm");
    public string GeneratePreviewId() => GenerateUlid("prv");
    public string GenerateShareId() => GenerateUlid("shr");

    public string SanitizeStorageId(string prefix, string? existingId)
    {
        if (!string.IsNullOrWhiteSpace(existingId) && 
            existingId.StartsWith($"{prefix}_"))
        {
            return existingId.Trim();
        }

        return GenerateUlid(prefix);
    }
}
