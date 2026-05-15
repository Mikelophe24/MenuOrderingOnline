$server = "localhost"
$db = "OnlineMenuDB"

function Run-Sql($sql) {
    Invoke-Sqlcmd -ServerInstance $server -Database $db -Query $sql
}

# ===== NGUYEN LIEU (Ingredients) =====
Run-Sql @"
SET IDENTITY_INSERT Ingredients ON;
INSERT INTO Ingredients (Id, Name, Unit, CurrentStock, MinStock, CreatedAt, UpdatedAt) VALUES
-- Thịt
(1,  N'Thịt ba chỉ lợn',       N'kg',   50,  5,  GETUTCDATE(), GETUTCDATE()),
(2,  N'Thịt sụn lợn',          N'kg',   30,  3,  GETUTCDATE(), GETUTCDATE()),
(3,  N'Bò ta (thịt bò Việt)',  N'kg',   40,  5,  GETUTCDATE(), GETUTCDATE()),
(4,  N'Ba chỉ bò Mỹ',         N'kg',   30,  3,  GETUTCDATE(), GETUTCDATE()),
(5,  N'Sườn non lợn',          N'kg',   25,  3,  GETUTCDATE(), GETUTCDATE()),
(6,  N'Sườn bò Mỹ',            N'kg',   20,  2,  GETUTCDATE(), GETUTCDATE()),
(7,  N'Lõi vai bò Mỹ',         N'kg',   20,  2,  GETUTCDATE(), GETUTCDATE()),
(8,  N'Bắp hoa bò Mỹ',         N'kg',   15,  2,  GETUTCDATE(), GETUTCDATE()),
(9,  N'Lõi vai Oushi',          N'kg',   10,  1,  GETUTCDATE(), GETUTCDATE()),
(10, N'Thăn ngoại Oushi',       N'kg',   10,  1,  GETUTCDATE(), GETUTCDATE()),
(11, N'Thịt trâu',              N'kg',   20,  2,  GETUTCDATE(), GETUTCDATE()),
(12, N'Thịt dài lợn',           N'kg',   25,  3,  GETUTCDATE(), GETUTCDATE()),

-- Nội tạng & Lai rai
(13, N'Dạ dày lợn',             N'kg',   15,  2,  GETUTCDATE(), GETUTCDATE()),
(14, N'Lòng lợn',               N'kg',   20,  2,  GETUTCDATE(), GETUTCDATE()),
(15, N'Khấu đuôi lợn',         N'kg',   15,  2,  GETUTCDATE(), GETUTCDATE()),
(16, N'Chân gà',                N'kg',   20,  2,  GETUTCDATE(), GETUTCDATE()),
(17, N'Xúc xích',               N'kg',   20,  3,  GETUTCDATE(), GETUTCDATE()),

-- Hải sản
(18, N'Tôm tươi',               N'kg',   25,  3,  GETUTCDATE(), GETUTCDATE()),
(19, N'Râu mực',                N'kg',   20,  2,  GETUTCDATE(), GETUTCDATE()),
(20, N'Bạch tuộc',              N'kg',   15,  2,  GETUTCDATE(), GETUTCDATE()),
(21, N'Mực trứng',              N'kg',   15,  2,  GETUTCDATE(), GETUTCDATE()),
(22, N'Hàu',                    N'kg',   15,  2,  GETUTCDATE(), GETUTCDATE()),
(23, N'Ốc móng tay',            N'kg',   15,  2,  GETUTCDATE(), GETUTCDATE()),
(24, N'Ngao',                   N'kg',   20,  3,  GETUTCDATE(), GETUTCDATE()),
(25, N'Thanh cua',              N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),

-- Rau, nấm, gia vị
(26, N'Nấm kim châm',           N'kg',   15,  2,  GETUTCDATE(), GETUTCDATE()),
(27, N'Nấm các loại',           N'kg',   15,  2,  GETUTCDATE(), GETUTCDATE()),
(28, N'Rau tổng hợp',           N'kg',   30,  5,  GETUTCDATE(), GETUTCDATE()),
(29, N'Cải cuốn',               N'kg',   15,  2,  GETUTCDATE(), GETUTCDATE()),
(30, N'Váng đậu',               N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),
(31, N'Mè (vừng)',              N'kg',    5,  1,  GETUTCDATE(), GETUTCDATE()),
(32, N'Sốt vừng cay',           N'lít',  5,  1,  GETUTCDATE(), GETUTCDATE()),
(33, N'Sa tế',                  N'lít',  5,  1,  GETUTCDATE(), GETUTCDATE()),
(34, N'Mỡ hành',                N'lít',  5,  1,  GETUTCDATE(), GETUTCDATE()),
(35, N'Rơm khô',                N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),

-- Khai vị
(36, N'Kim chi',                 N'kg',   20,  3,  GETUTCDATE(), GETUTCDATE()),
(37, N'Dưa chuột',              N'kg',   15,  3,  GETUTCDATE(), GETUTCDATE()),
(38, N'Rau salad',              N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),
(39, N'Bánh mỳ',                N'cái',  50, 10,  GETUTCDATE(), GETUTCDATE()),
(40, N'Bơ tỏi',                 N'kg',    5,  1,  GETUTCDATE(), GETUTCDATE()),
(41, N'Khoai tây',              N'kg',   30,  5,  GETUTCDATE(), GETUTCDATE()),
(42, N'Ngô',                    N'kg',   15,  3,  GETUTCDATE(), GETUTCDATE()),
(43, N'Khoai lang',             N'kg',   15,  3,  GETUTCDATE(), GETUTCDATE()),
(44, N'Phô mai bột',            N'kg',    5,  1,  GETUTCDATE(), GETUTCDATE()),

-- Viên thả lẩu
(45, N'Xúc xích phô mai',       N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),
(46, N'Sủi cảo',                N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),
(47, N'Viên tôm hùm',           N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),
(48, N'Đậu hũ phô mai',         N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),
(49, N'Viên thập cẩm',          N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),

-- Lẩu
(50, N'Nước lẩu Thái Tom Yum',  N'lít',  30,  5,  GETUTCDATE(), GETUTCDATE()),

-- Đồ uống
(51, N'Nước khoáng',            N'chai', 100, 20,  GETUTCDATE(), GETUTCDATE()),
(52, N'Coca Cola lon',           N'lon',  100, 20,  GETUTCDATE(), GETUTCDATE()),
(53, N'Cam Twister lon',        N'lon',   50, 10,  GETUTCDATE(), GETUTCDATE()),
(54, N'Siro Coca',              N'lít',   10,  2,  GETUTCDATE(), GETUTCDATE()),
(55, N'Trà túi lọc',            N'gói',  100, 20,  GETUTCDATE(), GETUTCDATE()),
(56, N'Chanh tươi',             N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),
(57, N'Quất tươi',              N'kg',    5,  1,  GETUTCDATE(), GETUTCDATE()),
(58, N'Sâm dứa',                N'kg',    5,  1,  GETUTCDATE(), GETUTCDATE()),
(59, N'Chanh leo',              N'kg',    5,  1,  GETUTCDATE(), GETUTCDATE()),
(60, N'Cam tươi',               N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),
(61, N'Dưa hấu',                N'kg',   15,  3,  GETUTCDATE(), GETUTCDATE()),
(62, N'Đào ngâm',               N'lít',   5,  1,  GETUTCDATE(), GETUTCDATE()),
(63, N'Sả tươi',                N'kg',    3,  1,  GETUTCDATE(), GETUTCDATE()),
(64, N'Sữa chua',               N'kg',    5,  1,  GETUTCDATE(), GETUTCDATE()),
(65, N'Đường',                  N'kg',   10,  2,  GETUTCDATE(), GETUTCDATE()),
(66, N'Đá viên',                N'kg',   50, 10,  GETUTCDATE(), GETUTCDATE()),

-- Rượu bia
(67, N'Rượu dừa',               N'chai',  20,  5,  GETUTCDATE(), GETUTCDATE()),
(68, N'Rượu trắng',             N'chai',  20,  5,  GETUTCDATE(), GETUTCDATE()),
(69, N'Rượu táo mèo',           N'chai',  15,  3,  GETUTCDATE(), GETUTCDATE()),
(70, N'Rượu mơ',                N'chai',  15,  3,  GETUTCDATE(), GETUTCDATE()),
(71, N'Rượu dâu tằm',           N'chai',  15,  3,  GETUTCDATE(), GETUTCDATE()),
(72, N'Rượu Soju',              N'chai',  30,  5,  GETUTCDATE(), GETUTCDATE()),
(73, N'Bia Việt',                N'lon',  100, 20,  GETUTCDATE(), GETUTCDATE()),
(74, N'Bia Tiger Bạc',           N'chai',  50, 10,  GETUTCDATE(), GETUTCDATE()),
(75, N'Bia Heineken',            N'chai',  50, 10,  GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Ingredients OFF;
"@

Write-Host "Ingredients: 75 done"

# ===== CONG THUC (DishIngredient) =====
# Format: DishId, IngredientId, QuantityNeeded (cho 1 phan)

Run-Sql @"
SET IDENTITY_INSERT DishIngredients ON;

DECLARE @now DATETIME2 = GETUTCDATE();

INSERT INTO DishIngredients (Id, DishId, IngredientId, QuantityNeeded, CreatedAt, UpdatedAt) VALUES
-- Khai Vi
(1,   1, 36, 0.15, @now, @now),   -- Kim Chi -> Kim chi 150g
(2,   2, 37, 0.15, @now, @now),   -- Dua Chuot -> Dua chuot 150g
(3,   3, 38, 0.15, @now, @now),   -- Salad -> Rau salad 150g
(4,   4, 39, 1,    @now, @now),   -- Banh My Bo -> Banh my 1 cai
(5,   4, 40, 0.03, @now, @now),   -- Banh My Bo -> Bo toi 30g
(6,   5, 41, 0.25, @now, @now),   -- Khoai Tay Chien -> Khoai tay 250g
(7,   6, 42, 0.2,  @now, @now),   -- Ngo Chien -> Ngo 200g
(8,   7, 43, 0.25, @now, @now),   -- Khoai Lang Ken -> Khoai lang 250g
(9,   8, 41, 0.25, @now, @now),   -- Khoai Tay Lac Pho Mai -> Khoai tay 250g
(10,  8, 44, 0.03, @now, @now),   -- Khoai Tay Lac Pho Mai -> Pho mai bot 30g

-- Thit Nuong
(11,  9,  1, 0.25, @now, @now),   -- Ba Chi Uop Me -> Ba chi lon 250g
(12,  9, 31, 0.01, @now, @now),   -- Ba Chi Uop Me -> Me 10g
(13, 10,  3, 0.25, @now, @now),   -- Bo Ta Sot Vung Cay -> Bo ta 250g
(14, 10, 32, 0.03, @now, @now),   -- Bo Ta Sot Vung Cay -> Sot vung cay 30ml
(15, 11,  3, 0.25, @now, @now),   -- Bo Ta Cuon Cai -> Bo ta 250g
(16, 11, 29, 0.1,  @now, @now),   -- Bo Ta Cuon Cai -> Cai cuon 100g
(17, 12,  5, 0.3,  @now, @now),   -- Suon Non Nuong -> Suon non 300g
(18, 13,  2, 0.25, @now, @now),   -- Thit Sun Nuong -> Thit sun 250g
(19, 14,  1, 0.3,  @now, @now),   -- Ba Chi Lon Thui Rom -> Ba chi lon 300g
(20, 14, 35, 0.1,  @now, @now),   -- Ba Chi Lon Thui Rom -> Rom kho 100g
(21, 15,  4, 0.25, @now, @now),   -- Ba Chi Bo My Cuon Nam Kim -> Ba chi bo My 250g
(22, 15, 26, 0.05, @now, @now),   -- Ba Chi Bo My Cuon Nam Kim -> Nam kim cham 50g
(23, 16, 27, 0.3,  @now, @now),   -- Nam Nuong -> Nam cac loai 300g
(24, 17, 12, 0.25, @now, @now),   -- Thit Dai Nuong -> Thit dai lon 250g
(25, 18,  3, 0.3,  @now, @now),   -- Bo Ta Nuong Tang -> Bo ta 300g
(26, 19,  6, 0.3,  @now, @now),   -- Suon Bo My -> Suon bo My 300g
(27, 20,  7, 0.25, @now, @now),   -- Loi Vai Bo My -> Loi vai bo My 250g
(28, 21,  4, 0.25, @now, @now),   -- Ba Chi Bo My -> Ba chi bo My 250g
(29, 22, 11, 0.25, @now, @now),   -- Thit Trau Nuong -> Thit trau 250g
(30, 23,  3, 0.25, @now, @now),   -- Bo Ta Cuon Nam Kim -> Bo ta 250g
(31, 23, 26, 0.05, @now, @now),   -- Bo Ta Cuon Nam Kim -> Nam kim cham 50g
(32, 24,  8, 0.3,  @now, @now),   -- Bap Hoa Bo My -> Bap hoa bo My 300g
(33, 25,  9, 0.25, @now, @now),   -- Loi Vai Oushi DB -> Loi vai Oushi 250g
(34, 26, 10, 0.25, @now, @now),   -- Than Ngoai Oushi DB -> Than ngoai Oushi 250g

-- Hai San Nuong
(35, 27, 18, 0.3,  @now, @now),   -- Tom Nhay Nuong -> Tom tuoi 300g
(36, 28, 19, 0.25, @now, @now),   -- Rau Muc Nuong -> Rau muc 250g
(37, 29, 20, 0.25, @now, @now),   -- Bach Tuoc Sa Te -> Bach tuoc 250g
(38, 29, 33, 0.02, @now, @now),   -- Bach Tuoc Sa Te -> Sa te 20ml
(39, 30, 21, 0.3,  @now, @now),   -- Muc Trung Nuong -> Muc trung 300g
(40, 31, 22, 0.3,  @now, @now),   -- Hau Nuong Mo Hanh -> Hau 300g
(41, 31, 34, 0.03, @now, @now),   -- Hau Nuong Mo Hanh -> Mo hanh 30ml
(42, 32, 23, 0.3,  @now, @now),   -- Oc Mong Tay Nuong -> Oc mong tay 300g
(43, 32, 34, 0.02, @now, @now),   -- Oc Mong Tay Nuong -> Mo hanh 20ml

-- Lai Rai
(44, 33,  1, 0.15, @now, @now),   -- Thit Xien Nuong -> Ba chi lon 150g
(45, 34, 17, 0.15, @now, @now),   -- Xuc Xich Nuong -> Xuc xich 150g
(46, 35, 13, 0.25, @now, @now),   -- Da Day Nuong -> Da day 250g
(47, 36, 15, 0.25, @now, @now),   -- Khau Duoi Nuong -> Khau duoi 250g
(48, 37, 14, 0.25, @now, @now),   -- Long Lon Nuong -> Long lon 250g
(49, 38, 16, 0.25, @now, @now),   -- Chan Ga Rut Xuong -> Chan ga 250g
(50, 39, 14, 0.25, @now, @now),   -- Long Nuong Lai Rai -> Long lon 250g

-- Lau Set (dung nhieu nguyen lieu)
(51, 40, 50, 1.5,  @now, @now),   -- Set 2 nguoi -> Nuoc lau 1.5 lit
(52, 40,  3, 0.3,  @now, @now),   -- Set 2 nguoi -> Bo ta 300g
(53, 40,  1, 0.2,  @now, @now),   -- Set 2 nguoi -> Ba chi lon 200g
(54, 40, 28, 0.3,  @now, @now),   -- Set 2 nguoi -> Rau tong hop 300g
(55, 40, 26, 0.1,  @now, @now),   -- Set 2 nguoi -> Nam kim cham 100g
(56, 41, 50, 2,    @now, @now),   -- Set 3 nguoi -> Nuoc lau 2 lit
(57, 41,  3, 0.4,  @now, @now),   -- Set 3 nguoi -> Bo ta 400g
(58, 41,  1, 0.3,  @now, @now),   -- Set 3 nguoi -> Ba chi lon 300g
(59, 41, 28, 0.4,  @now, @now),   -- Set 3 nguoi -> Rau 400g
(60, 41, 26, 0.15, @now, @now),   -- Set 3 nguoi -> Nam 150g
(61, 42, 50, 2.5,  @now, @now),   -- Set 4 nguoi
(62, 42,  3, 0.5,  @now, @now),
(63, 42,  1, 0.4,  @now, @now),
(64, 42, 28, 0.5,  @now, @now),
(65, 42, 26, 0.2,  @now, @now),
(66, 43, 50, 3,    @now, @now),   -- Set 5 nguoi
(67, 43,  3, 0.6,  @now, @now),
(68, 43,  1, 0.5,  @now, @now),
(69, 43, 28, 0.6,  @now, @now),
(70, 43, 26, 0.25, @now, @now),
(71, 44, 50, 3.5,  @now, @now),   -- Set 6 nguoi
(72, 44,  3, 0.8,  @now, @now),
(73, 44,  1, 0.6,  @now, @now),
(74, 44, 28, 0.7,  @now, @now),
(75, 44, 26, 0.3,  @now, @now);

SET IDENTITY_INSERT DishIngredients OFF;
"@

Write-Host "DishIngredients batch 1: 75 done"

Run-Sql @"
SET IDENTITY_INSERT DishIngredients ON;
DECLARE @now DATETIME2 = GETUTCDATE();

INSERT INTO DishIngredients (Id, DishId, IngredientId, QuantityNeeded, CreatedAt, UpdatedAt) VALUES
-- Lau - Thit Goi Them
(76, 45,  2, 0.3,  @now, @now),   -- Thit Sun (Lau) -> Thit sun 300g
(77, 46,  4, 0.3,  @now, @now),   -- Ba Chi Bo My (Lau) -> Ba chi bo My 300g
(78, 47,  3, 0.3,  @now, @now),   -- Thit Bo Ta (Lau) -> Bo ta 300g

-- Lau - Hai San Goi Them
(79, 48, 24, 0.3,  @now, @now),   -- Ngao (Lau) -> Ngao 300g
(80, 49, 25, 0.2,  @now, @now),   -- Thanh Cua (Lau) -> Thanh cua 200g
(81, 50, 19, 0.25, @now, @now),   -- Rau Muc (Lau) -> Rau muc 250g
(82, 51, 18, 0.3,  @now, @now),   -- Tom (Lau) -> Tom tuoi 300g
(83, 52, 20, 0.25, @now, @now),   -- Bach Tuoc (Lau) -> Bach tuoc 250g
(84, 53, 21, 0.3,  @now, @now),   -- Muc Trung (Lau) -> Muc trung 300g

-- Vien Tha Lau & Rau
(85, 54, 17, 0.15, @now, @now),   -- Xuc Xich Thuong -> Xuc xich 150g
(86, 55, 45, 0.15, @now, @now),   -- Xuc Xich Pho Mai -> Xuc xich pho mai 150g
(87, 56, 46, 0.2,  @now, @now),   -- Sui Cao Lau -> Sui cao 200g
(88, 57, 47, 0.15, @now, @now),   -- Vien Tom Hum -> Vien tom hum 150g
(89, 58, 48, 0.15, @now, @now),   -- Dau Hu Pho Mai -> Dau hu pho mai 150g
(90, 59, 49, 0.2,  @now, @now),   -- Vien Thap Cam -> Vien thap cam 200g
(91, 60, 28, 0.3,  @now, @now),   -- Rau Tong Hop -> Rau 300g
(92, 61, 30, 0.1,  @now, @now),   -- Vang Dau / Nam Kim -> Vang dau 100g
(93, 61, 26, 0.1,  @now, @now),   -- Vang Dau / Nam Kim -> Nam kim cham 100g

-- Do Uong
(94,  62, 51, 1,   @now, @now),   -- Nuoc Khoang -> 1 chai
(95,  63, 52, 1,   @now, @now),   -- Coca/Cam Twister -> 1 lon
(96,  64, 54, 0.05,@now, @now),   -- Coca Tuoi -> Siro 50ml
(97,  64, 66, 0.2, @now, @now),   -- Coca Tuoi -> Da 200g
(98,  65, 55, 1,   @now, @now),   -- Tra Chanh/Quat -> Tra 1 goi
(99,  65, 56, 0.05,@now, @now),   -- Tra Chanh/Quat -> Chanh 50g
(100, 65, 65, 0.02,@now, @now),   -- Tra Chanh/Quat -> Duong 20g
(101, 66, 58, 0.05,@now, @now),   -- Tra Sam Dua -> Sam dua 50g
(102, 66, 55, 1,   @now, @now),   -- Tra Sam Dua -> Tra 1 goi
(103, 67, 56, 0.1, @now, @now),   -- Nuoc Chanh Tuoi -> Chanh 100g
(104, 67, 65, 0.03,@now, @now),   -- Nuoc Chanh Tuoi -> Duong 30g
(105, 67, 66, 0.2, @now, @now),   -- Nuoc Chanh Tuoi -> Da 200g
(106, 68, 59, 0.1, @now, @now),   -- Nuoc Chanh Leo -> Chanh leo 100g
(107, 68, 65, 0.03,@now, @now),   -- Nuoc Chanh Leo -> Duong 30g
(108, 69, 60, 0.3, @now, @now),   -- Nuoc Ep Cam -> Cam tuoi 300g
(109, 70, 61, 0.4, @now, @now),   -- Nuoc Ep Dua Hau -> Dua hau 400g
(110, 71, 62, 0.05,@now, @now),   -- Tra Dao Cam Sa -> Dao ngam 50ml
(111, 71, 60, 0.1, @now, @now),   -- Tra Dao Cam Sa -> Cam 100g
(112, 71, 63, 0.02,@now, @now),   -- Tra Dao Cam Sa -> Sa tuoi 20g
(113, 71, 55, 1,   @now, @now),   -- Tra Dao Cam Sa -> Tra 1 goi
(114, 72, 64, 0.15,@now, @now),   -- Sua Chua Danh Da -> Sua chua 150g
(115, 72, 66, 0.2, @now, @now),   -- Sua Chua Danh Da -> Da 200g

-- Ruou Bia (1 chai/lon moi phan)
(116, 73, 67, 1,   @now, @now),   -- Ruou Dua -> 1 chai
(117, 74, 68, 1,   @now, @now),   -- Ruou Trang -> 1 chai
(118, 75, 69, 1,   @now, @now),   -- Ruou Tao Meo -> 1 chai
(119, 76, 70, 1,   @now, @now),   -- Ruou Mo -> 1 chai
(120, 77, 71, 1,   @now, @now),   -- Ruou Dau Tam -> 1 chai
(121, 78, 72, 1,   @now, @now),   -- Ruou Soju -> 1 chai
(122, 79, 73, 1,   @now, @now),   -- Bia Viet -> 1 lon
(123, 80, 74, 1,   @now, @now),   -- Bia Tiger Bac -> 1 chai
(124, 81, 75, 1,   @now, @now);   -- Bia Heineken -> 1 chai

SET IDENTITY_INSERT DishIngredients OFF;
"@

Write-Host "DishIngredients batch 2: 49 done"
Write-Host ""
Write-Host "=== SEED COMPLETED ==="
Write-Host "  75 nguyen lieu (Ingredients)"
Write-Host "  124 cong thuc (DishIngredients)"
