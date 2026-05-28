using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace OnlineMenu.Infrastructure.Services.Chatbot;

/// <summary>
/// Wrap Groq REST API (OpenAI-compatible chat/completions).
/// Free tier: 14,400 req/day, model llama-3.3-70b-versatile, latency ~300ms.
/// </summary>
public class GroqClient
{
    private const string Endpoint = "https://api.groq.com/openai/v1/chat/completions";
    private const string DefaultModel = "llama-3.3-70b-versatile";

    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly ILogger<GroqClient> _logger;

    public GroqClient(HttpClient http, IConfiguration config, ILogger<GroqClient> logger)
    {
        _http = http;
        _apiKey = config["Groq:ApiKey"] ?? string.Empty;
        _model = config["Groq:Model"] ?? DefaultModel;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public async Task<string> GenerateAsync(
        string systemPrompt,
        IReadOnlyList<GroqTurn> history,
        string userMessage,
        CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Groq API key chua duoc cau hinh (Groq:ApiKey).");
        }

        var messages = new List<GroqMessage>
        {
            new("system", systemPrompt),
        };

        foreach (var turn in history)
        {
            // Groq dung "assistant" cho reply cua model, "user" cho user
            var role = turn.Role == "model" || turn.Role == "assistant" ? "assistant" : "user";
            messages.Add(new GroqMessage(role, turn.Text));
        }
        messages.Add(new GroqMessage("user", userMessage));

        var payload = new GroqRequest(
            Model: _model,
            Messages: messages,
            Temperature: 0.6,
            MaxTokens: 512
        );

        using var req = new HttpRequestMessage(HttpMethod.Post, Endpoint)
        {
            Content = JsonContent.Create(payload),
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        using var resp = await _http.SendAsync(req, ct);

        if (!resp.IsSuccessStatusCode)
        {
            var body = await resp.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Groq API tra ve {Status}: {Body}", (int)resp.StatusCode, body);
            throw new HttpRequestException($"Groq API loi {(int)resp.StatusCode}");
        }

        var parsed = await resp.Content.ReadFromJsonAsync<GroqResponse>(cancellationToken: ct);
        var text = parsed?.Choices?.FirstOrDefault()?.Message?.Content;
        return string.IsNullOrWhiteSpace(text) ? string.Empty : text.Trim();
    }
}

public record GroqTurn(string Role, string Text);

// ===== Request / response payloads (OpenAI-compatible) =====

internal record GroqRequest(
    [property: JsonPropertyName("model")] string Model,
    [property: JsonPropertyName("messages")] List<GroqMessage> Messages,
    [property: JsonPropertyName("temperature")] double Temperature,
    [property: JsonPropertyName("max_tokens")] int MaxTokens
);

internal record GroqMessage(
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("content")] string Content
);

internal record GroqResponse(
    [property: JsonPropertyName("choices")] List<GroqChoice>? Choices
);

internal record GroqChoice(
    [property: JsonPropertyName("message")] GroqMessage? Message
);
