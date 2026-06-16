# 09. Trợ lý ảo AI (Chatbot) & chuyển nhân viên

## Mục đích
Cung cấp trợ lý ảo trả lời câu hỏi của khách (giờ mở cửa, món ăn, đặt bàn…) bằng **LLM (Groq)**; khi bot không đủ khả năng, khách có thể **escalate** sang **nhân viên thật**, trao đổi realtime qua SignalR.

## Tác nhân
- **Guest (ẩn danh):** chat với bot, yêu cầu gặp nhân viên.
- **Employee, Manager:** tiếp nhận và trả lời các phiên được escalate.

## Công nghệ
- **Groq LLM** (`GroqClient`) sinh câu trả lời.
- **`ChatContextBuilder`**: dựng *system prompt* từ dữ liệu thực (thực đơn, thông tin quán) để bot trả lời đúng ngữ cảnh.
- **SignalR `ChatHub`** đẩy tin nhắn realtime.

## Vòng đời phiên (`ChatSessionStatus`)
```
Active ──(khách bấm "Gọi nhân viên")──► WaitingStaff ──(staff trả lời)──► StaffJoined ──► Closed
  │                                                                                          ▲
  └──────────────────────────── staff/khách đóng ──────────────────────────────────────────┘
```
- **Active:** khách đang chat với **bot**.
- **WaitingStaff:** đã escalate, chờ nhân viên vào.
- **StaffJoined:** nhân viên đã vào, **bot ngừng trả lời**.
- **Closed:** đã đóng.

## Endpoint liên quan
| Method | Route | Quyền | Chức năng |
|--------|-------|-------|-----------|
| POST | `/api/chatbot/message` | Công khai | Gửi tin nhắn, nhận bot reply |
| GET | `/api/chatbot/sessions/{token}` | Công khai | Khôi phục phiên sau F5 (theo token) |
| POST | `/api/chatbot/sessions/{token}/escalate` | Công khai | Yêu cầu gặp nhân viên |
| GET | `/api/chatbot/staff/sessions` | Staff | Danh sách phiên cần hỗ trợ |
| GET | `/api/chatbot/staff/sessions/{id}` | Staff | Lịch sử một phiên |
| POST | `/api/chatbot/staff/sessions/{id}/reply` | Staff | Nhân viên trả lời |
| POST | `/api/chatbot/staff/sessions/{id}/close` | Staff | Đóng phiên |

## Luồng 1 — Khách chat với bot (`ReplyAsync`)
1. Nếu chưa có `sessionToken` (hoặc token không tồn tại) → tạo **ChatSession** mới (`Token` GUID, status `Active`).
2. Phiên đã `Closed` → báo lỗi.
3. Lưu tin nhắn khách (`Role = User`), cập nhật `LastActivityAt`.
4. **Nếu phiên không còn `Active`** (đã WaitingStaff/StaffJoined) → **không gọi bot**, chỉ lưu tin (nhân viên sẽ trả lời).
5. Nếu LLM **chưa cấu hình API key** → trả thông báo bảo trì + gợi ý gọi nhân viên.
6. Nạp **lịch sử 10 lượt gần nhất** (tiết kiệm token) + system prompt → gọi `GroqClient.GenerateAsync`.
7. Lỗi LLM / trả lời rỗng → thông báo sự cố + gợi ý escalate.
8. Lưu tin bot (`Role = Bot`). Phân tích câu trả lời: nếu chứa **cue escalate** (vd "gọi nhân viên", "không chắc", "không có thông tin"…) → đặt `SuggestEscalate = true` để UI hiện nút gọi nhân viên.

```
POST message ─► có token? lấy session : tạo mới (Active)
            ─► lưu User message
            ─► status != Active? → KHÔNG gọi bot (chờ staff)
            ─► nạp 10 lượt + system prompt ─► Groq LLM
            ─► lưu Bot message + cờ SuggestEscalate
```

## Luồng 2 — Escalate sang nhân viên (`EscalateAsync`)
1. Khách bấm "Gọi nhân viên thật" → `POST escalate`.
2. Đặt phiên `WaitingStaff`, ghi `EscalatedAt`, thêm tin hệ thống *"Khách yêu cầu gặp nhân viên."* (idempotent — gọi lại không lỗi).
3. Controller bắn SignalR:
   - `ChatEscalated` tới nhóm **staff** (`staff-chats`) kèm tin nhắn cuối của khách.
   - `StatusChanged → WaitingStaff` tới nhóm phiên (`chat-{token}`).

## Luồng 3 — Nhân viên trả lời (`StaffReplyAsync`)
1. Nhân viên xem danh sách phiên (`ListStaffSessionsAsync` — chỉ `WaitingStaff`/`StaffJoined`, kèm preview tin cuối).
2. Gửi `POST staff/.../reply`:
   - Nếu phiên chưa `StaffJoined` → **tự chuyển** sang `StaffJoined` và gán `AssignedStaffId` = nhân viên hiện tại (từ đó **bot ngừng trả lời**).
   - Lưu tin (`Role = Staff`).
3. Controller bắn `NewMessage` + `StatusChanged` tới nhóm phiên `chat-{token}` → khách thấy ngay.

## Luồng 4 — Đóng phiên (`CloseSessionAsync`)
- Đặt `Closed`, ghi `ClosedAt`, thêm tin hệ thống. Bắn `StatusChanged → Closed` tới khách và `SessionRemoved` tới nhóm staff.

## SignalR `ChatHub` — nhóm
- **`chat-{token}`**: khách join bằng token (không cần auth) để nhận reply của nhân viên.
- **`staff-chats`**: nhân viên (`[Authorize]`) join để nhận thông báo escalation.

## Điểm kỹ thuật đáng chú ý
- **Định danh ẩn danh bằng GUID token** → khôi phục phiên sau F5 mà không cần đăng nhập; token khó đoán nên an toàn tương đương session cookie.
- **Giới hạn 10 lượt lịch sử** gửi cho LLM để tiết kiệm token/chi phí.
- **Bot tự nhường người thật:** khi `StaffJoined`, các tin tiếp theo không gọi LLM nữa.
- **Fallback nhiều lớp:** chưa cấu hình key / lỗi LLM / trả lời rỗng đều có thông báo + gợi ý gọi nhân viên.
- **System prompt từ dữ liệu thật** → bot trả lời đúng theo thực đơn hiện hành.

## Câu hỏi bảo vệ
- **Bot lấy thông tin trả lời từ đâu?** `ChatContextBuilder` dựng system prompt từ dữ liệu quán (thực đơn…), không bịa.
- **Khi nào chuyển nhân viên?** Khách chủ động bấm, hoặc bot tự gợi ý khi không chắc chắn.
- **Sau khi nhân viên vào, bot còn trả lời không?** Không — phiên `StaffJoined` thì mọi tin do nhân viên xử lý.
- **Chat ẩn danh sao giữ được phiên khi reload?** Dùng GUID token lưu phía client để khôi phục.
