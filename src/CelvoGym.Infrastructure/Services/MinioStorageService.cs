using CelvoGym.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Minio;
using Minio.DataModel.Args;

namespace CelvoGym.Infrastructure.Services;

public sealed class MinioStorageService : IStorageService
{
    private readonly IMinioClient _client;
    private readonly string _publicUrl;
    private readonly ILogger<MinioStorageService> _logger;

    public MinioStorageService(IConfiguration configuration, ILogger<MinioStorageService> logger)
    {
        _logger = logger;

        var endpoint = configuration["Minio:Endpoint"] ?? "localhost:9000";
        var accessKey = configuration["Minio:AccessKey"] ?? "minioadmin";
        var secretKey = configuration["Minio:SecretKey"] ?? "minioadmin";
        var useSsl = configuration.GetValue<bool>("Minio:UseSsl");
        _publicUrl = configuration["Minio:PublicUrl"] ?? $"http://{endpoint}";

        _client = new MinioClient()
            .WithEndpoint(endpoint)
            .WithCredentials(accessKey, secretKey)
            .WithSSL(useSsl)
            .Build();
    }

    public async Task<string> UploadAsync(string bucket, string fileName, Stream content, string contentType, CancellationToken ct = default)
    {
        await EnsureBucketAsync(bucket, ct);

        await _client.PutObjectAsync(new PutObjectArgs()
            .WithBucket(bucket)
            .WithObject(fileName)
            .WithStreamData(content)
            .WithObjectSize(content.Length)
            .WithContentType(contentType), ct);

        _logger.LogInformation("Uploaded {FileName} to {Bucket}", fileName, bucket);
        return $"{_publicUrl}/{bucket}/{fileName}";
    }

    public async Task DeleteAsync(string bucket, string fileName, CancellationToken ct = default)
    {
        await _client.RemoveObjectAsync(new RemoveObjectArgs()
            .WithBucket(bucket)
            .WithObject(fileName), ct);

        _logger.LogInformation("Deleted {FileName} from {Bucket}", fileName, bucket);
    }

    private async Task EnsureBucketAsync(string bucket, CancellationToken ct)
    {
        var exists = await _client.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket), ct);
        if (!exists)
        {
            await _client.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket), ct);

            var policy = $$"""
            {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": ["arn:aws:s3:::{{bucket}}/*"]
                }]
            }
            """;
            await _client.SetPolicyAsync(new SetPolicyArgs().WithBucket(bucket).WithPolicy(policy), ct);
            _logger.LogInformation("Created bucket {Bucket} with public-read policy", bucket);
        }
    }
}
