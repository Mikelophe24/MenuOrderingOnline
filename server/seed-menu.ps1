$server = "localhost"
$db = "OnlineMenuDB"

function Run-Sql($sql) {
    Invoke-Sqlcmd -ServerInstance $server -Database $db -Query $sql
}

# Categories
Run-Sql @"
SET IDENTITY_INSERT Categories ON;
INSERT INTO Categories (Id, Name, Description, CreatedAt, UpdatedAt) VALUES
(1, N'Khai Vị',                N'Các món khai vị, ăn nhẹ',             GETUTCDATE(), GETUTCDATE()),
(2, N'Thịt Nướng',             N'Các loại thịt nướng BBQ',             GETUTCDATE(), GETUTCDATE()),
(3, N'Hải Sản Nướng',          N'Các loại hải sản nướng',              GETUTCDATE(), GETUTCDATE()),
(4, N'Lai Rai',                N'Các món nhậu lai rai',                GETUTCDATE(), GETUTCDATE()),
(5, N'Lẩu',                    N'Lẩu Thái Tom Yum và set lẩu',        GETUTCDATE(), GETUTCDATE()),
(6, N'Lẩu - Thịt Gọi Thêm',   N'Thịt gọi thêm cho lẩu',             GETUTCDATE(), GETUTCDATE()),
(7, N'Lẩu - Hải Sản Gọi Thêm', N'Hải sản gọi thêm cho lẩu',         GETUTCDATE(), GETUTCDATE()),
(8, N'Viên Thả Lẩu & Rau',    N'Viên, topping và rau cho lẩu',        GETUTCDATE(), GETUTCDATE()),
(9, N'Đồ Uống',               N'Nước ngọt, nước ép, trà',             GETUTCDATE(), GETUTCDATE()),
(10, N'Rượu - Bia',            N'Các loại rượu và bia',                GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Categories OFF;
"@

Write-Host "Categories: 10 done"

# Dishes - Khai Vi
Run-Sql @"
SET IDENTITY_INSERT Dishes ON;
INSERT INTO Dishes (Id, Name, Price, Description, Image, Status, CategoryId, CreatedAt, UpdatedAt) VALUES
(1,  N'Kim Chi',                15000, N'Kim chi truyền thống',           '', 0, 1, GETUTCDATE(), GETUTCDATE()),
(2,  N'Dưa Chuột',             15000, N'Dưa chuột muối',                '', 0, 1, GETUTCDATE(), GETUTCDATE()),
(3,  N'Salad',                  20000, N'Salad rau trộn',                '', 0, 1, GETUTCDATE(), GETUTCDATE()),
(4,  N'Bánh Mỳ Bơ',            20000, N'Bánh mỳ bơ tỏi',               '', 0, 1, GETUTCDATE(), GETUTCDATE()),
(5,  N'Khoai Tây Chiên',       35000, N'Khoai tây chiên giòn',          '', 0, 1, GETUTCDATE(), GETUTCDATE()),
(6,  N'Ngô Chiên',             35000, N'Ngô chiên giòn',                '', 0, 1, GETUTCDATE(), GETUTCDATE()),
(7,  N'Khoai Lang Kén',        35000, N'Khoai lang kén giòn',           '', 0, 1, GETUTCDATE(), GETUTCDATE()),
(8,  N'Khoai Tây Lắc Phô Mai', 42000, N'Khoai tây lắc phô mai',        '', 0, 1, GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Dishes OFF;
"@

Write-Host "Khai Vi: 8 done"

# Dishes - Thit Nuong
Run-Sql @"
SET IDENTITY_INSERT Dishes ON;
INSERT INTO Dishes (Id, Name, Price, Description, Image, Status, CategoryId, CreatedAt, UpdatedAt) VALUES
(9,  N'Ba Chỉ Ướp Mè',                 75000, N'Phần nhỏ 50K / Phần lớn 75K',    '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(10, N'Bò Ta Sốt Vừng Cay',            75000, N'Bò ta sốt vừng cay nướng',       '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(11, N'Bò Ta Cuốn Cải',                75000, N'Bò ta cuốn cải nướng',           '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(12, N'Sườn Non Nướng',                 75000, N'Sườn non nướng BBQ',             '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(13, N'Thịt Sụn Nướng',                 75000, N'Phần nhỏ 50K / Phần lớn 75K',   '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(14, N'Ba Chỉ Lợn Thui Rơm Thơm',      80000, N'Ba chỉ lợn thui rơm thơm',     '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(15, N'Ba Chỉ Bò Mỹ Cuốn Nấm Kim',     75000, N'Phần nhỏ 50K / Phần lớn 75K',  '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(16, N'Nấm Nướng',                       75000, N'Nấm các loại nướng',            '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(17, N'Thịt Dài Nướng',                  75000, N'Thịt dài nướng BBQ',            '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(18, N'Bò Ta Nướng Tảng',               100000, N'Bò ta nướng tảng nguyên miếng', '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(19, N'Sườn Bò Mỹ',                     100000, N'Sườn bò Mỹ nhập khẩu',         '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(20, N'Lõi Vai Bò Mỹ',                  100000, N'Lõi vai bò Mỹ nhập khẩu',      '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(21, N'Ba Chỉ Bò Mỹ',                    75000, N'Ba chỉ bò Mỹ nướng',           '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(22, N'Thịt Trâu Nướng',                 75000, N'Phần nhỏ 50K / Phần lớn 75K',  '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(23, N'Bò Ta Cuốn Nấm Kim',              75000, N'Phần nhỏ 50K / Phần lớn 75K',  '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(24, N'Bắp Hoa Bò Mỹ',                  100000, N'Bắp hoa bò Mỹ nhập khẩu',     '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(25, N'Lõi Vai Oushi Đặc Biệt',         110000, N'Lõi vai Oushi cao cấp',        '', 0, 2, GETUTCDATE(), GETUTCDATE()),
(26, N'Thăn Ngoại Oushi Đặc Biệt',      110000, N'Thăn ngoại Oushi cao cấp',     '', 0, 2, GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Dishes OFF;
"@

Write-Host "Thit Nuong: 18 done"

# Dishes - Hai San Nuong
Run-Sql @"
SET IDENTITY_INSERT Dishes ON;
INSERT INTO Dishes (Id, Name, Price, Description, Image, Status, CategoryId, CreatedAt, UpdatedAt) VALUES
(27, N'Tôm Nhảy Nướng',         80000, N'Tôm tươi nướng',               '', 0, 3, GETUTCDATE(), GETUTCDATE()),
(28, N'Râu Mực Nướng',          75000, N'Râu mực nướng sa tế',          '', 0, 3, GETUTCDATE(), GETUTCDATE()),
(29, N'Bạch Tuộc Sa Tế',        75000, N'Bạch tuộc nướng sa tế',        '', 0, 3, GETUTCDATE(), GETUTCDATE()),
(30, N'Mực Trứng Nướng',        80000, N'Mực trứng nướng nguyên con',   '', 0, 3, GETUTCDATE(), GETUTCDATE()),
(31, N'Hàu Nướng Mỡ Hành',     75000, N'Phần nhỏ 50K / Phần lớn 75K', '', 0, 3, GETUTCDATE(), GETUTCDATE()),
(32, N'Ốc Móng Tay Nướng',     75000, N'Ốc móng tay nướng mỡ hành',   '', 0, 3, GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Dishes OFF;
"@

Write-Host "Hai San Nuong: 6 done"

# Dishes - Lai Rai
Run-Sql @"
SET IDENTITY_INSERT Dishes ON;
INSERT INTO Dishes (Id, Name, Price, Description, Image, Status, CategoryId, CreatedAt, UpdatedAt) VALUES
(33, N'Thịt Xiên Nướng',        50000, N'Thịt xiên que nướng',          '', 0, 4, GETUTCDATE(), GETUTCDATE()),
(34, N'Xúc Xích Nướng',         50000, N'Xúc xích nướng',              '', 0, 4, GETUTCDATE(), GETUTCDATE()),
(35, N'Dạ Dày Nướng',           75000, N'Dạ dày nướng giòn',           '', 0, 4, GETUTCDATE(), GETUTCDATE()),
(36, N'Khấu Đuôi Nướng',       75000, N'Khấu đuôi nướng',             '', 0, 4, GETUTCDATE(), GETUTCDATE()),
(37, N'Lòng Lợn Nướng',        75000, N'Phần nhỏ 50K / Phần lớn 75K', '', 0, 4, GETUTCDATE(), GETUTCDATE()),
(38, N'Chân Gà Rút Xương',     75000, N'Phần nhỏ 50K / Phần lớn 75K', '', 0, 4, GETUTCDATE(), GETUTCDATE()),
(39, N'Lòng Nướng Lai Rai',    75000, N'Phần nhỏ 50K / Phần lớn 75K', '', 0, 4, GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Dishes OFF;
"@

Write-Host "Lai Rai: 7 done"

# Dishes - Lau Set
Run-Sql @"
SET IDENTITY_INSERT Dishes ON;
INSERT INTO Dishes (Id, Name, Price, Description, Image, Status, CategoryId, CreatedAt, UpdatedAt) VALUES
(40, N'Lẩu Thái Tom Yum - Set 2 Người', 259000, N'Set lẩu Thái dành cho 2 người', '', 0, 5, GETUTCDATE(), GETUTCDATE()),
(41, N'Lẩu Thái Tom Yum - Set 3 Người', 359000, N'Set lẩu Thái dành cho 3 người', '', 0, 5, GETUTCDATE(), GETUTCDATE()),
(42, N'Lẩu Thái Tom Yum - Set 4 Người', 459000, N'Set lẩu Thái dành cho 4 người', '', 0, 5, GETUTCDATE(), GETUTCDATE()),
(43, N'Lẩu Thái Tom Yum - Set 5 Người', 559000, N'Set lẩu Thái dành cho 5 người', '', 0, 5, GETUTCDATE(), GETUTCDATE()),
(44, N'Lẩu Thái Tom Yum - Set 6 Người', 659000, N'Set lẩu Thái dành cho 6 người', '', 0, 5, GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Dishes OFF;
"@

Write-Host "Lau Set: 5 done"

# Dishes - Lau Thit Goi Them
Run-Sql @"
SET IDENTITY_INSERT Dishes ON;
INSERT INTO Dishes (Id, Name, Price, Description, Image, Status, CategoryId, CreatedAt, UpdatedAt) VALUES
(45, N'Thịt Sụn (Lẩu)',        99000, N'Thịt sụn gọi thêm cho lẩu',    '', 0, 6, GETUTCDATE(), GETUTCDATE()),
(46, N'Ba Chỉ Bò Mỹ (Lẩu)',   99000, N'Ba chỉ bò Mỹ thái lát cho lẩu', '', 0, 6, GETUTCDATE(), GETUTCDATE()),
(47, N'Thịt Bò Ta (Lẩu)',      99000, N'Thịt bò ta thái lát cho lẩu',   '', 0, 6, GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Dishes OFF;
"@

Write-Host "Lau Thit: 3 done"

# Dishes - Lau Hai San Goi Them
Run-Sql @"
SET IDENTITY_INSERT Dishes ON;
INSERT INTO Dishes (Id, Name, Price, Description, Image, Status, CategoryId, CreatedAt, UpdatedAt) VALUES
(48, N'Ngao (Lẩu)',             25000, N'Ngao tươi cho lẩu',            '', 0, 7, GETUTCDATE(), GETUTCDATE()),
(49, N'Thanh Cua (Lẩu)',        50000, N'Thanh cua cho lẩu',            '', 0, 7, GETUTCDATE(), GETUTCDATE()),
(50, N'Râu Mực (Lẩu)',          99000, N'Râu mực cho lẩu',              '', 0, 7, GETUTCDATE(), GETUTCDATE()),
(51, N'Tôm (Lẩu)',              99000, N'Tôm tươi cho lẩu',             '', 0, 7, GETUTCDATE(), GETUTCDATE()),
(52, N'Bạch Tuộc (Lẩu)',        99000, N'Bạch tuộc cho lẩu',            '', 0, 7, GETUTCDATE(), GETUTCDATE()),
(53, N'Mực Trứng (Lẩu)',        99000, N'Mực trứng cho lẩu',            '', 0, 7, GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Dishes OFF;
"@

Write-Host "Lau Hai San: 6 done"

# Dishes - Vien Tha Lau & Rau
Run-Sql @"
SET IDENTITY_INSERT Dishes ON;
INSERT INTO Dishes (Id, Name, Price, Description, Image, Status, CategoryId, CreatedAt, UpdatedAt) VALUES
(54, N'Xúc Xích Thường',        50000, N'Xúc xích thường thả lẩu',     '', 0, 8, GETUTCDATE(), GETUTCDATE()),
(55, N'Xúc Xích Phô Mai',       75000, N'Xúc xích phô mai thả lẩu',    '', 0, 8, GETUTCDATE(), GETUTCDATE()),
(56, N'Sủi Cảo Lẩu',            60000, N'Sủi cảo thả lẩu',             '', 0, 8, GETUTCDATE(), GETUTCDATE()),
(57, N'Viên Tôm Hùm',           75000, N'Viên tôm hùm thả lẩu',        '', 0, 8, GETUTCDATE(), GETUTCDATE()),
(58, N'Đậu Hũ Phô Mai',         75000, N'Đậu hũ phô mai thả lẩu',      '', 0, 8, GETUTCDATE(), GETUTCDATE()),
(59, N'Viên Thập Cẩm',          80000, N'Viên thập cẩm các loại',       '', 0, 8, GETUTCDATE(), GETUTCDATE()),
(60, N'Rau Tổng Hợp',           20000, N'Rau các loại cho lẩu',         '', 0, 8, GETUTCDATE(), GETUTCDATE()),
(61, N'Váng Đậu / Nấm Kim',    30000, N'Váng đậu hoặc nấm kim châm',  '', 0, 8, GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Dishes OFF;
"@

Write-Host "Vien Tha Lau & Rau: 8 done"

# Dishes - Do Uong
Run-Sql @"
SET IDENTITY_INSERT Dishes ON;
INSERT INTO Dishes (Id, Name, Price, Description, Image, Status, CategoryId, CreatedAt, UpdatedAt) VALUES
(62, N'Nước Khoáng',            12000, N'Nước khoáng đóng chai',        '', 0, 9, GETUTCDATE(), GETUTCDATE()),
(63, N'Coca / Cam Twister Lon', 15000, N'Coca Cola hoặc Cam Twister lon', '', 0, 9, GETUTCDATE(), GETUTCDATE()),
(64, N'Coca Tươi',              15000, N'Coca tươi pha',                '', 0, 9, GETUTCDATE(), GETUTCDATE()),
(65, N'Trà Chanh / Trà Quất',  15000, N'Trà chanh hoặc trà quất',      '', 0, 9, GETUTCDATE(), GETUTCDATE()),
(66, N'Trà Sâm Dứa',           20000, N'Trà sâm dứa mát lạnh',        '', 0, 9, GETUTCDATE(), GETUTCDATE()),
(67, N'Nước Chanh Tươi',        20000, N'Nước chanh tươi vắt',          '', 0, 9, GETUTCDATE(), GETUTCDATE()),
(68, N'Nước Chanh Leo',         25000, N'Nước chanh leo tươi',          '', 0, 9, GETUTCDATE(), GETUTCDATE()),
(69, N'Nước Ép Cam Tươi',      30000, N'Nước ép cam tươi nguyên chất', '', 0, 9, GETUTCDATE(), GETUTCDATE()),
(70, N'Nước Ép Dưa Hấu',       30000, N'Nước ép dưa hấu tươi',        '', 0, 9, GETUTCDATE(), GETUTCDATE()),
(71, N'Trà Đào Cam Sả',        30000, N'Trà đào cam sả',              '', 0, 9, GETUTCDATE(), GETUTCDATE()),
(72, N'Sữa Chua Đánh Đá',      30000, N'Sữa chua đánh đá mát lạnh',   '', 0, 9, GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Dishes OFF;
"@

Write-Host "Do Uong: 11 done"

# Dishes - Ruou Bia
Run-Sql @"
SET IDENTITY_INSERT Dishes ON;
INSERT INTO Dishes (Id, Name, Price, Description, Image, Status, CategoryId, CreatedAt, UpdatedAt) VALUES
(73, N'Rượu Dừa',               60000, N'Rượu dừa',                    '', 0, 10, GETUTCDATE(), GETUTCDATE()),
(74, N'Rượu Trắng',             70000, N'Rượu trắng',                  '', 0, 10, GETUTCDATE(), GETUTCDATE()),
(75, N'Rượu Táo Mèo',          80000, N'Rượu táo mèo',               '', 0, 10, GETUTCDATE(), GETUTCDATE()),
(76, N'Rượu Mơ',                80000, N'Rượu mơ',                     '', 0, 10, GETUTCDATE(), GETUTCDATE()),
(77, N'Rượu Dâu Tằm',          80000, N'Rượu dâu tằm',               '', 0, 10, GETUTCDATE(), GETUTCDATE()),
(78, N'Rượu Soju',              80000, N'Rượu Soju Hàn Quốc',         '', 0, 10, GETUTCDATE(), GETUTCDATE()),
(79, N'Bia Việt',                20000, N'Bia Việt lon',                '', 0, 10, GETUTCDATE(), GETUTCDATE()),
(80, N'Bia Chai Tiger Bạc',     25000, N'Bia Tiger Bạc chai',          '', 0, 10, GETUTCDATE(), GETUTCDATE()),
(81, N'Bia Chai Heineken',      25000, N'Bia Heineken chai',           '', 0, 10, GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Dishes OFF;
"@

Write-Host "Ruou Bia: 9 done"
Write-Host ""
Write-Host "SEED COMPLETED: 10 categories, 81 dishes"
