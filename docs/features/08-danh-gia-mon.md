# 08. Đánh giá món ăn

## Mục đích
Khách để lại đánh giá (sao + bình luận) cho món đã dùng, **không cần tài khoản**, giúp quán thu thập phản hồi và hiển thị độ hài lòng.

## Tác nhân
- **Guest:** gửi đánh giá, xem đánh giá của món.

## Endpoint liên quan
| Method | Route | Chức năng |
|--------|-------|-----------|
| GET | `/api/reviews/dish/{dishId}` | Lấy danh sách đánh giá của một món |
| POST | `/api/reviews` | Gửi đánh giá mới |

## Mô hình dữ liệu (`DishReview`)
| Trường | Ý nghĩa |
|--------|---------|
| `DishId` | Món được đánh giá (FK) |
| `GuestName` | Tên khách |
| `TableNumber` | Số bàn khi đánh giá |
| `Rating` | Số sao 1–5 |
| `Comment` | Bình luận (tùy chọn) |

## Luồng gửi đánh giá
1. Khách gửi `POST /api/reviews` với `dishId`, `guestName`, `tableNumber`, `rating (1–5)`, `comment`.
2. Hệ thống tạo bản ghi `DishReview` gắn với món.
3. `GET /api/reviews/dish/{dishId}` trả toàn bộ đánh giá của món để hiển thị (kèm điểm trung bình tính phía client/aggregate).

```
Khách dùng món ─► POST /reviews { dishId, rating, comment }
                    └─ lưu DishReview (gắn DishId)
Trang món ─► GET /reviews/dish/{id} ─► hiển thị sao + bình luận
```

## Quan hệ
- `Dish 1 — N DishReview` (`DishReview.DishId`): một món có nhiều đánh giá.

## Điểm kỹ thuật đáng chú ý
- **Không gắn tài khoản** → đánh giá ẩn danh, định danh nhẹ bằng tên + số bàn.
- **Rating ràng buộc 1–5** ở tầng nghiệp vụ.

## Câu hỏi bảo vệ
- **Vì sao đánh giá không cần đăng nhập?** Đối tượng là khách vãng lai; yêu cầu tài khoản sẽ giảm tỉ lệ phản hồi.
- **Chống đánh giá ảo thế nào?** Có thể mở rộng: chỉ cho đánh giá món đã có trong đơn `Paid` của bàn đó (định hướng phát triển).
