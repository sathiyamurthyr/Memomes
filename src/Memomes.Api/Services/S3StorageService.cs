using Amazon.S3;
using Amazon.S3.Model;

namespace Memomes.Api.Services;

public interface IS3StorageService
{
    string GeneratePresignedUploadUrl(string objectKey, string contentType, int expirationSeconds = 60);
    string GeneratePresignedDownloadUrl(string objectKey, int expirationSeconds = 60);
    string GeneratePresignedChunkUploadUrl(string objectKey, string uploadId, int partNumber, int expirationSeconds = 60);
    Task<string> InitiateMultipartUploadAsync(string objectKey, string contentType);
    Task CompleteMultipartUploadAsync(string objectKey, string uploadId, List<PartETag> partETags);
    Task DeleteObjectAsync(string objectKey);
    Task DeleteObjectsBatchAsync(List<string> objectKeys);
}

public class S3StorageService : IS3StorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly ILogger<S3StorageService> _logger;

    public S3StorageService(IConfiguration configuration, ILogger<S3StorageService> logger)
    {
        _logger = logger;
        _bucketName = configuration["AWS:BucketName"] ?? "sathus-memomes-vault";

        var serviceUrl = configuration["AWS:ServiceURL"] ?? "https://s3.us-west-004.backblazeb2.com";
        var accessKey = configuration["AWS:AccessKeyId"] ?? "mock_access_key";
        var secretKey = configuration["AWS:SecretAccessKey"] ?? "mock_secret_key";
        var region = configuration["AWS:Region"] ?? "us-west-004";

        var config = new AmazonS3Config
        {
            ServiceURL = serviceUrl,
            AuthenticationRegion = region,
            ForcePathStyle = true
        };

        _s3Client = new AmazonS3Client(accessKey, secretKey, config);
    }

    public string GeneratePresignedUploadUrl(string objectKey, string contentType, int expirationSeconds = 60)
    {
        // Enforce maximum expiration of 60 seconds as per specification
        int maxExpiry = Math.Min(expirationSeconds, 60);
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = DateTime.UtcNow.AddSeconds(maxExpiry)
        };

        return _s3Client.GetPreSignedURL(request);
    }

    public string GeneratePresignedDownloadUrl(string objectKey, int expirationSeconds = 60)
    {
        // Enforce maximum expiration of 60 seconds as per specification
        int maxExpiry = Math.Min(expirationSeconds, 60);
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = objectKey,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.AddSeconds(maxExpiry)
        };

        return _s3Client.GetPreSignedURL(request);
    }

    public string GeneratePresignedChunkUploadUrl(string objectKey, string uploadId, int partNumber, int expirationSeconds = 60)
    {
        int maxExpiry = Math.Min(expirationSeconds, 60);
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.AddSeconds(maxExpiry),
            UploadId = uploadId,
            PartNumber = partNumber
        };

        return _s3Client.GetPreSignedURL(request);
    }

    public async Task<string> InitiateMultipartUploadAsync(string objectKey, string contentType)
    {
        try
        {
            var request = new InitiateMultipartUploadRequest
            {
                BucketName = _bucketName,
                Key = objectKey,
                ContentType = contentType
            };

            var response = await _s3Client.InitiateMultipartUploadAsync(request);
            return response.UploadId;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "S3 InitiateMultipartUpload fallback for mock environment");
            return Guid.NewGuid().ToString("N");
        }
    }

    public async Task CompleteMultipartUploadAsync(string objectKey, string uploadId, List<PartETag> partETags)
    {
        try
        {
            var request = new CompleteMultipartUploadRequest
            {
                BucketName = _bucketName,
                Key = objectKey,
                UploadId = uploadId,
                PartETags = partETags
            };

            await _s3Client.CompleteMultipartUploadAsync(request);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "S3 CompleteMultipartUpload fallback for mock environment");
        }
    }

    public async Task DeleteObjectAsync(string objectKey)
    {
        try
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = objectKey
            };
            await _s3Client.DeleteObjectAsync(request);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "S3 DeleteObject fallback for mock environment");
        }
    }

    public async Task DeleteObjectsBatchAsync(List<string> objectKeys)
    {
        if (objectKeys == null || objectKeys.Count == 0) return;

        try
        {
            var request = new DeleteObjectsRequest
            {
                BucketName = _bucketName,
                Objects = objectKeys.Select(k => new KeyVersion { Key = k }).ToList()
            };
            await _s3Client.DeleteObjectsAsync(request);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "S3 DeleteObjectsBatch fallback for mock environment");
        }
    }
}
