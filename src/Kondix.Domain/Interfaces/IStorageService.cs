namespace CelvoGym.Domain.Interfaces;

public interface IStorageService
{
    Task<string> UploadAsync(string bucket, string fileName, Stream content, string contentType, CancellationToken ct = default);
    Task DeleteAsync(string bucket, string fileName, CancellationToken ct = default);
}
