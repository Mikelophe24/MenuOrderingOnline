using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using OnlineMenu.Core.Enums;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.Infrastructure.Services.Chatbot;

/// <summary>
/// Xay dung system prompt cho Gemini: thong tin nha hang + menu hien tai tu DB.
/// </summary>
public class ChatContextBuilder
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public ChatContextBuilder(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<string> BuildSystemPromptAsync(CancellationToken ct = default)
    {
        var info = _config.GetSection("Restaurant");
        var name = info["Name"] ?? "Nhat Nuong";
        var address = info["Address"] ?? "Ha Noi";
        var openHours = info["OpenHours"] ?? "10:00 - 22:00 hang ngay";
        var hotline = info["Hotline"] ?? "(lien he website)";

        var dishes = await _db.Dishes
            .AsNoTracking()
            .Include(d => d.Category)
            .OrderBy(d => d.Category!.Name)
            .ThenBy(d => d.Name)
            .Select(d => new
            {
                d.Name,
                d.Price,
                d.Description,
                d.Status,
                CategoryName = d.Category!.Name,
            })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine($"Bạn là trợ lý ảo của nhà hàng BBQ \"{name}\" tại Hà Nội.");
        sb.AppendLine("Trả lời ngắn gọn (tối đa 4 câu), lịch sự, xưng \"em\" gọi khách là \"anh/chị\", tiếng Việt chuẩn.");
        sb.AppendLine();

        sb.AppendLine("THÔNG TIN NHÀ HÀNG:");
        sb.AppendLine($"- Tên: {name}");
        sb.AppendLine($"- Địa chỉ: {address}");
        sb.AppendLine($"- Giờ mở cửa: {openHours}");
        sb.AppendLine($"- Hotline: {hotline}");
        sb.AppendLine();

        if (dishes.Count > 0)
        {
            sb.AppendLine("MENU HIỆN TẠI (CHỈ tư vấn các món trong danh sách này, KHÔNG bịa thêm món khác):");
            string? currentCategory = null;
            foreach (var d in dishes)
            {
                if (d.CategoryName != currentCategory)
                {
                    currentCategory = d.CategoryName;
                    sb.AppendLine();
                    sb.AppendLine($"[{currentCategory}]");
                }
                var statusNote = d.Status == DishStatus.Available ? "" : " (HẾT HÀNG)";
                var price = $"{d.Price:N0}đ";
                var desc = string.IsNullOrWhiteSpace(d.Description) ? "" : $" - {d.Description}";
                sb.AppendLine($"- {d.Name}: {price}{statusNote}{desc}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("CHÍNH SÁCH:");
        sb.AppendLine("- Đặt bàn: vào trang Đặt bàn trên website, trước ít nhất 2 giờ.");
        sb.AppendLine("- Hủy đặt bàn: miễn phí trước 1 giờ so với giờ đặt.");
        sb.AppendLine("- Thanh toán: tiền mặt hoặc QR VietQR tại quầy.");
        sb.AppendLine();

        sb.AppendLine("QUY TẮC TUYỆT ĐỐI:");
        sb.AppendLine("- KHÔNG bịa thông tin. Nếu không chắc, trả lời: \"Để em chuyển anh/chị tới nhân viên thật ạ.\"");
        sb.AppendLine("- KHÔNG tự đặt bàn / tự nhận đơn / tự xác nhận thanh toán. Chỉ hướng dẫn user thao tác trên web.");
        sb.AppendLine("- KHÔNG đưa ra mức giá khác với danh sách MENU ở trên.");
        sb.AppendLine("- Nếu user yêu cầu món không có trong MENU, trả lời: \"Hiện tại menu nhà hàng chưa có món này ạ.\"");
        sb.AppendLine("- Câu trả lời ngắn gọn, đi thẳng vào vấn đề.");

        return sb.ToString();
    }
}
