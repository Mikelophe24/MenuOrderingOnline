using System.Text.Json;
using System.Text.Json.Serialization;

namespace OnlineMenu.API.Extensions;

/// <summary>
/// Ensures all DateTime values are serialized with "Z" suffix (UTC indicator)
/// so the frontend JavaScript correctly interprets them as UTC timestamps.
/// Without this, "2026-03-25T12:27:00" is treated as local time by new Date().
/// With this, "2026-03-25T12:27:00Z" is correctly treated as UTC.
/// </summary>
public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.GetDateTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        // Ensure the DateTime is written as UTC with "Z" suffix
        writer.WriteStringValue(DateTime.SpecifyKind(value, DateTimeKind.Utc));
    }
}
