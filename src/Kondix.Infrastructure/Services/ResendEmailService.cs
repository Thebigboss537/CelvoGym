using System.Net.Http.Json;
using CelvoGym.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CelvoGym.Infrastructure.Services;

public sealed class ResendEmailService(HttpClient httpClient, IConfiguration configuration, ILogger<ResendEmailService> logger) : IEmailService
{
    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        var apiKey = configuration["Resend:ApiKey"];
        var fromEmail = configuration["Resend:FromEmail"];

        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(fromEmail))
        {
            logger.LogWarning("Resend not configured. Email to {To}: {Subject}", to, subject);
            return;
        }

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Content = JsonContent.Create(new
            {
                from = fromEmail,
                to = new[] { to },
                subject,
                html = htmlBody
            });

            var response = await httpClient.SendAsync(request, ct);
            response.EnsureSuccessStatusCode();
            logger.LogInformation("Email sent to {To}", to);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {To}", to);
            throw;
        }
    }
}
