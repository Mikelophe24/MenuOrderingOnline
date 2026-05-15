USE OnlineMenuDB;
GO

SET IDENTITY_INSERT Categories ON;
INSERT INTO Categories (Id, Name, Description, CreatedAt, UpdatedAt) VALUES
(1, N'Khai V&#7883;', N'C&#225;c m&#243;n khai v&#7883;, &#259;n nh&#7865;', GETUTCDATE(), GETUTCDATE()),
(2, N'Th&#7883;t N&#432;&#7899;ng', N'C&#225;c lo&#7841;i th&#7883;t n&#432;&#7899;ng BBQ', GETUTCDATE(), GETUTCDATE()),
(3, N'H&#7843;i S&#7843;n N&#432;&#7899;ng', N'C&#225;c lo&#7841;i h&#7843;i s&#7843;n n&#432;&#7899;ng', GETUTCDATE(), GETUTCDATE()),
(4, N'Lai Rai', N'C&#225;c m&#243;n nh&#7853;u lai rai', GETUTCDATE(), GETUTCDATE()),
(5, N'L&#7849;u', N'L&#7849;u Th&#225;i Tom Yum v&#224; set l&#7849;u', GETUTCDATE(), GETUTCDATE()),
(6, N'L&#7849;u - Th&#7883;t G&#7885;i Th&#234;m', N'Th&#7883;t g&#7885;i th&#234;m cho l&#7849;u', GETUTCDATE(), GETUTCDATE()),
(7, N'L&#7849;u - H&#7843;i S&#7843;n G&#7885;i Th&#234;m', N'H&#7843;i s&#7843;n g&#7885;i th&#234;m cho l&#7849;u', GETUTCDATE(), GETUTCDATE()),
(8, N'Vi&#234;n Th&#7843; L&#7849;u & Rau', N'Vi&#234;n, topping v&#224; rau cho l&#7849;u', GETUTCDATE(), GETUTCDATE()),
(9, N'&#272;&#7891; U&#7889;ng', N'N&#432;&#7899;c ng&#7885;t, n&#432;&#7899;c &#233;p, tr&#224;', GETUTCDATE(), GETUTCDATE()),
(10, N'R&#432;&#7907;u - Bia', N'C&#225;c lo&#7841;i r&#432;&#7907;u v&#224; bia', GETUTCDATE(), GETUTCDATE());
SET IDENTITY_INSERT Categories OFF;
GO
PRINT N'Categories done';
