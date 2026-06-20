using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;

namespace OnlineMenu.Infrastructure.Data;

public static class SeedData
{
    public static void Seed(AppDbContext context)
    {
        SeedMenu(context);
        SeedReviews(context);
    }

    private static void SeedMenu(AppDbContext context)
    {
        if (context.Categories.Any()) return; // Da co data -> skip

        // ===== CATEGORIES =====
        var categories = new List<Category>
        {
            new() { Name = "Khai V\u1ECB", Description = "C\u00E1c m\u00F3n khai v\u1ECB, \u0103n nh\u1EB9" },
            new() { Name = "Th\u1ECBt N\u01B0\u1EDBng", Description = "C\u00E1c lo\u1EA1i th\u1ECBt n\u01B0\u1EDBng BBQ" },
            new() { Name = "H\u1EA3i S\u1EA3n N\u01B0\u1EDBng", Description = "C\u00E1c lo\u1EA1i h\u1EA3i s\u1EA3n n\u01B0\u1EDBng" },
            new() { Name = "Lai Rai", Description = "C\u00E1c m\u00F3n nh\u1EADu lai rai" },
            new() { Name = "L\u1EA9u", Description = "L\u1EA9u Th\u00E1i Tom Yum v\u00E0 set l\u1EA9u" },
            new() { Name = "L\u1EA9u - Th\u1ECBt G\u1ECDi Th\u00EAm", Description = "Th\u1ECBt g\u1ECDi th\u00EAm cho l\u1EA9u" },
            new() { Name = "L\u1EA9u - H\u1EA3i S\u1EA3n G\u1ECDi Th\u00EAm", Description = "H\u1EA3i s\u1EA3n g\u1ECDi th\u00EAm cho l\u1EA9u" },
            new() { Name = "Vi\u00EAn Th\u1EA3 L\u1EA9u & Rau", Description = "Vi\u00EAn, topping v\u00E0 rau cho l\u1EA9u" },
            new() { Name = "\u0110\u1ED3 U\u1ED1ng", Description = "N\u01B0\u1EDBc ng\u1ECDt, n\u01B0\u1EDBc \u00E9p, tr\u00E0" },
            new() { Name = "R\u01B0\u1EE3u - Bia", Description = "C\u00E1c lo\u1EA1i r\u01B0\u1EE3u v\u00E0 bia" },
        };
        context.Categories.AddRange(categories);
        context.SaveChanges();

        var catIds = context.Categories.ToDictionary(c => c.Name, c => c.Id);

        // ===== DISHES =====
        var dishes = CreateDishes(catIds);
        context.Dishes.AddRange(dishes);
        context.SaveChanges();

        // ===== INGREDIENTS =====
        var ingredients = CreateIngredients();
        context.Ingredients.AddRange(ingredients);
        context.SaveChanges();

        var ingIds = context.Ingredients.ToDictionary(i => i.Name, i => i.Id);
        var dishIds = context.Dishes.ToDictionary(d => d.Name, d => d.Id);

        // ===== DISH INGREDIENTS (Recipes) =====
        var recipes = CreateRecipes(dishIds, ingIds);
        context.Set<DishIngredient>().AddRange(recipes);
        context.SaveChanges();
    }

    private static List<Dish> CreateDishes(Dictionary<string, int> c)
    {
        return new List<Dish>
        {
            // Khai Vi
            D("Kim Chi", 15000, "Kim chi truy\u1EC1n th\u1ED1ng", c["Khai V\u1ECB"]),
            D("D\u01B0a Chu\u1ED9t", 15000, "D\u01B0a chu\u1ED9t mu\u1ED1i", c["Khai V\u1ECB"]),
            D("Salad", 20000, "Salad rau tr\u1ED9n", c["Khai V\u1ECB"]),
            D("B\u00E1nh M\u1EF3 B\u01A1", 20000, "B\u00E1nh m\u1EF3 b\u01A1 t\u1ECFi", c["Khai V\u1ECB"]),
            D("Khoai T\u00E2y Chi\u00EAn", 35000, "Khoai t\u00E2y chi\u00EAn gi\u00F2n", c["Khai V\u1ECB"]),
            D("Ng\u00F4 Chi\u00EAn", 35000, "Ng\u00F4 chi\u00EAn gi\u00F2n", c["Khai V\u1ECB"]),
            D("Khoai Lang K\u00E9n", 35000, "Khoai lang k\u00E9n gi\u00F2n", c["Khai V\u1ECB"]),
            D("Khoai T\u00E2y L\u1EAFc Ph\u00F4 Mai", 42000, "Khoai t\u00E2y l\u1EAFc ph\u00F4 mai", c["Khai V\u1ECB"]),

            // Thit Nuong
            D("Ba Ch\u1EC9 \u01AF\u1EDBp M\u00E8", 75000, "Ph\u1EA7n nh\u1ECF 50K / Ph\u1EA7n l\u1EDBn 75K", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("B\u00F2 Ta S\u1ED1t V\u1EEBng Cay", 75000, "B\u00F2 ta s\u1ED1t v\u1EEBng cay n\u01B0\u1EDBng", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("B\u00F2 Ta Cu\u1ED1n C\u1EA3i", 75000, "B\u00F2 ta cu\u1ED1n c\u1EA3i n\u01B0\u1EDBng", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("S\u01B0\u1EDDn Non N\u01B0\u1EDBng", 75000, "S\u01B0\u1EDDn non n\u01B0\u1EDBng BBQ", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("Th\u1ECBt S\u1EE5n N\u01B0\u1EDBng", 75000, "Ph\u1EA7n nh\u1ECF 50K / Ph\u1EA7n l\u1EDBn 75K", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("Ba Ch\u1EC9 L\u1EE3n Thui R\u01A1m Th\u01A1m", 80000, "Ba ch\u1EC9 l\u1EE3n thui r\u01A1m th\u01A1m", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("Ba Ch\u1EC9 B\u00F2 M\u1EF9 Cu\u1ED1n N\u1EA5m Kim", 75000, "Ph\u1EA7n nh\u1ECF 50K / Ph\u1EA7n l\u1EDBn 75K", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("N\u1EA5m N\u01B0\u1EDBng", 75000, "N\u1EA5m c\u00E1c lo\u1EA1i n\u01B0\u1EDBng", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("Th\u1ECBt D\u00E0i N\u01B0\u1EDBng", 75000, "Th\u1ECBt d\u00E0i n\u01B0\u1EDBng BBQ", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("B\u00F2 Ta N\u01B0\u1EDBng T\u1EA3ng", 100000, "B\u00F2 ta n\u01B0\u1EDBng t\u1EA3ng nguy\u00EAn mi\u1EBFng", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("S\u01B0\u1EDDn B\u00F2 M\u1EF9", 100000, "S\u01B0\u1EDDn b\u00F2 M\u1EF9 nh\u1EADp kh\u1EA9u", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("L\u00F5i Vai B\u00F2 M\u1EF9", 100000, "L\u00F5i vai b\u00F2 M\u1EF9 nh\u1EADp kh\u1EA9u", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("Ba Ch\u1EC9 B\u00F2 M\u1EF9", 75000, "Ba ch\u1EC9 b\u00F2 M\u1EF9 n\u01B0\u1EDBng", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("Th\u1ECBt Tr\u00E2u N\u01B0\u1EDBng", 75000, "Ph\u1EA7n nh\u1ECF 50K / Ph\u1EA7n l\u1EDBn 75K", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("B\u00F2 Ta Cu\u1ED1n N\u1EA5m Kim", 75000, "Ph\u1EA7n nh\u1ECF 50K / Ph\u1EA7n l\u1EDBn 75K", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("B\u1EAFp Hoa B\u00F2 M\u1EF9", 100000, "B\u1EAFp hoa b\u00F2 M\u1EF9 nh\u1EADp kh\u1EA9u", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("L\u00F5i Vai Oushi \u0110\u1EB7c Bi\u1EC7t", 110000, "L\u00F5i vai Oushi cao c\u1EA5p", c["Th\u1ECBt N\u01B0\u1EDBng"]),
            D("Th\u0103n Ngo\u1EA1i Oushi \u0110\u1EB7c Bi\u1EC7t", 110000, "Th\u0103n ngo\u1EA1i Oushi cao c\u1EA5p", c["Th\u1ECBt N\u01B0\u1EDBng"]),

            // Hai San Nuong
            D("T\u00F4m Nh\u1EA3y N\u01B0\u1EDBng", 80000, "T\u00F4m t\u01B0\u01A1i n\u01B0\u1EDBng", c["H\u1EA3i S\u1EA3n N\u01B0\u1EDBng"]),
            D("R\u00E2u M\u1EF1c N\u01B0\u1EDBng", 75000, "R\u00E2u m\u1EF1c n\u01B0\u1EDBng sa t\u1EBF", c["H\u1EA3i S\u1EA3n N\u01B0\u1EDBng"]),
            D("B\u1EA1ch Tu\u1ED9c Sa T\u1EBF", 75000, "B\u1EA1ch tu\u1ED9c n\u01B0\u1EDBng sa t\u1EBF", c["H\u1EA3i S\u1EA3n N\u01B0\u1EDBng"]),
            D("M\u1EF1c Tr\u1EE9ng N\u01B0\u1EDBng", 80000, "M\u1EF1c tr\u1EE9ng n\u01B0\u1EDBng nguy\u00EAn con", c["H\u1EA3i S\u1EA3n N\u01B0\u1EDBng"]),
            D("H\u00E0u N\u01B0\u1EDBng M\u1EE1 H\u00E0nh", 75000, "Ph\u1EA7n nh\u1ECF 50K / Ph\u1EA7n l\u1EDBn 75K", c["H\u1EA3i S\u1EA3n N\u01B0\u1EDBng"]),
            D("\u1ED0c M\u00F3ng Tay N\u01B0\u1EDBng", 75000, "\u1ED0c m\u00F3ng tay n\u01B0\u1EDBng m\u1EE1 h\u00E0nh", c["H\u1EA3i S\u1EA3n N\u01B0\u1EDBng"]),

            // Lai Rai
            D("Th\u1ECBt Xi\u00EAn N\u01B0\u1EDBng", 50000, "Th\u1ECBt xi\u00EAn que n\u01B0\u1EDBng", c["Lai Rai"]),
            D("X\u00FAc X\u00EDch N\u01B0\u1EDBng", 50000, "X\u00FAc x\u00EDch n\u01B0\u1EDBng", c["Lai Rai"]),
            D("D\u1EA1 D\u00E0y N\u01B0\u1EDBng", 75000, "D\u1EA1 d\u00E0y n\u01B0\u1EDBng gi\u00F2n", c["Lai Rai"]),
            D("Kh\u1EA5u \u0110u\u00F4i N\u01B0\u1EDBng", 75000, "Kh\u1EA5u \u0111u\u00F4i n\u01B0\u1EDBng", c["Lai Rai"]),
            D("L\u00F2ng L\u1EE3n N\u01B0\u1EDBng", 75000, "Ph\u1EA7n nh\u1ECF 50K / Ph\u1EA7n l\u1EDBn 75K", c["Lai Rai"]),
            D("Ch\u00E2n G\u00E0 R\u00FAt X\u01B0\u01A1ng", 75000, "Ph\u1EA7n nh\u1ECF 50K / Ph\u1EA7n l\u1EDBn 75K", c["Lai Rai"]),
            D("L\u00F2ng N\u01B0\u1EDBng Lai Rai", 75000, "Ph\u1EA7n nh\u1ECF 50K / Ph\u1EA7n l\u1EDBn 75K", c["Lai Rai"]),

            // Lau Set
            D("L\u1EA9u Th\u00E1i Tom Yum - Set 2 Ng\u01B0\u1EDDi", 259000, "Set l\u1EA9u Th\u00E1i d\u00E0nh cho 2 ng\u01B0\u1EDDi", c["L\u1EA9u"]),
            D("L\u1EA9u Th\u00E1i Tom Yum - Set 3 Ng\u01B0\u1EDDi", 359000, "Set l\u1EA9u Th\u00E1i d\u00E0nh cho 3 ng\u01B0\u1EDDi", c["L\u1EA9u"]),
            D("L\u1EA9u Th\u00E1i Tom Yum - Set 4 Ng\u01B0\u1EDDi", 459000, "Set l\u1EA9u Th\u00E1i d\u00E0nh cho 4 ng\u01B0\u1EDDi", c["L\u1EA9u"]),
            D("L\u1EA9u Th\u00E1i Tom Yum - Set 5 Ng\u01B0\u1EDDi", 559000, "Set l\u1EA9u Th\u00E1i d\u00E0nh cho 5 ng\u01B0\u1EDDi", c["L\u1EA9u"]),
            D("L\u1EA9u Th\u00E1i Tom Yum - Set 6 Ng\u01B0\u1EDDi", 659000, "Set l\u1EA9u Th\u00E1i d\u00E0nh cho 6 ng\u01B0\u1EDDi", c["L\u1EA9u"]),

            // Lau - Thit Goi Them
            D("Th\u1ECBt S\u1EE5n (L\u1EA9u)", 99000, "Th\u1ECBt s\u1EE5n g\u1ECDi th\u00EAm cho l\u1EA9u", c["L\u1EA9u - Th\u1ECBt G\u1ECDi Th\u00EAm"]),
            D("Ba Ch\u1EC9 B\u00F2 M\u1EF9 (L\u1EA9u)", 99000, "Ba ch\u1EC9 b\u00F2 M\u1EF9 th\u00E1i l\u00E1t cho l\u1EA9u", c["L\u1EA9u - Th\u1ECBt G\u1ECDi Th\u00EAm"]),
            D("Th\u1ECBt B\u00F2 Ta (L\u1EA9u)", 99000, "Th\u1ECBt b\u00F2 ta th\u00E1i l\u00E1t cho l\u1EA9u", c["L\u1EA9u - Th\u1ECBt G\u1ECDi Th\u00EAm"]),

            // Lau - Hai San Goi Them
            D("Ngao (L\u1EA9u)", 25000, "Ngao t\u01B0\u01A1i cho l\u1EA9u", c["L\u1EA9u - H\u1EA3i S\u1EA3n G\u1ECDi Th\u00EAm"]),
            D("Thanh Cua (L\u1EA9u)", 50000, "Thanh cua cho l\u1EA9u", c["L\u1EA9u - H\u1EA3i S\u1EA3n G\u1ECDi Th\u00EAm"]),
            D("R\u00E2u M\u1EF1c (L\u1EA9u)", 99000, "R\u00E2u m\u1EF1c cho l\u1EA9u", c["L\u1EA9u - H\u1EA3i S\u1EA3n G\u1ECDi Th\u00EAm"]),
            D("T\u00F4m (L\u1EA9u)", 99000, "T\u00F4m t\u01B0\u01A1i cho l\u1EA9u", c["L\u1EA9u - H\u1EA3i S\u1EA3n G\u1ECDi Th\u00EAm"]),
            D("B\u1EA1ch Tu\u1ED9c (L\u1EA9u)", 99000, "B\u1EA1ch tu\u1ED9c cho l\u1EA9u", c["L\u1EA9u - H\u1EA3i S\u1EA3n G\u1ECDi Th\u00EAm"]),
            D("M\u1EF1c Tr\u1EE9ng (L\u1EA9u)", 99000, "M\u1EF1c tr\u1EE9ng cho l\u1EA9u", c["L\u1EA9u - H\u1EA3i S\u1EA3n G\u1ECDi Th\u00EAm"]),

            // Vien Tha Lau & Rau
            D("X\u00FAc X\u00EDch Th\u01B0\u1EDDng", 50000, "X\u00FAc x\u00EDch th\u01B0\u1EDDng th\u1EA3 l\u1EA9u", c["Vi\u00EAn Th\u1EA3 L\u1EA9u & Rau"]),
            D("X\u00FAc X\u00EDch Ph\u00F4 Mai", 75000, "X\u00FAc x\u00EDch ph\u00F4 mai th\u1EA3 l\u1EA9u", c["Vi\u00EAn Th\u1EA3 L\u1EA9u & Rau"]),
            D("S\u1EE7i C\u1EA3o L\u1EA9u", 60000, "S\u1EE7i c\u1EA3o th\u1EA3 l\u1EA9u", c["Vi\u00EAn Th\u1EA3 L\u1EA9u & Rau"]),
            D("Vi\u00EAn T\u00F4m H\u00F9m", 75000, "Vi\u00EAn t\u00F4m h\u00F9m th\u1EA3 l\u1EA9u", c["Vi\u00EAn Th\u1EA3 L\u1EA9u & Rau"]),
            D("\u0110\u1EADu H\u0169 Ph\u00F4 Mai", 75000, "\u0110\u1EADu h\u0169 ph\u00F4 mai th\u1EA3 l\u1EA9u", c["Vi\u00EAn Th\u1EA3 L\u1EA9u & Rau"]),
            D("Vi\u00EAn Th\u1EADp C\u1EA9m", 80000, "Vi\u00EAn th\u1EADp c\u1EA9m c\u00E1c lo\u1EA1i", c["Vi\u00EAn Th\u1EA3 L\u1EA9u & Rau"]),
            D("Rau T\u1ED5ng H\u1EE3p", 20000, "Rau c\u00E1c lo\u1EA1i cho l\u1EA9u", c["Vi\u00EAn Th\u1EA3 L\u1EA9u & Rau"]),
            D("V\u00E1ng \u0110\u1EADu / N\u1EA5m Kim", 30000, "V\u00E1ng \u0111\u1EADu ho\u1EB7c n\u1EA5m kim ch\u00E2m", c["Vi\u00EAn Th\u1EA3 L\u1EA9u & Rau"]),

            // Do Uong
            D("N\u01B0\u1EDBc Kho\u00E1ng", 12000, "N\u01B0\u1EDBc kho\u00E1ng \u0111\u00F3ng chai", c["\u0110\u1ED3 U\u1ED1ng"]),
            D("Coca / Cam Twister Lon", 15000, "Coca Cola ho\u1EB7c Cam Twister lon", c["\u0110\u1ED3 U\u1ED1ng"]),
            D("Coca T\u01B0\u01A1i", 15000, "Coca t\u01B0\u01A1i pha", c["\u0110\u1ED3 U\u1ED1ng"]),
            D("Tr\u00E0 Chanh / Tr\u00E0 Qu\u1EA5t", 15000, "Tr\u00E0 chanh ho\u1EB7c tr\u00E0 qu\u1EA5t", c["\u0110\u1ED3 U\u1ED1ng"]),
            D("Tr\u00E0 S\u00E2m D\u1EE9a", 20000, "Tr\u00E0 s\u00E2m d\u1EE9a m\u00E1t l\u1EA1nh", c["\u0110\u1ED3 U\u1ED1ng"]),
            D("N\u01B0\u1EDBc Chanh T\u01B0\u01A1i", 20000, "N\u01B0\u1EDBc chanh t\u01B0\u01A1i v\u1EAFt", c["\u0110\u1ED3 U\u1ED1ng"]),
            D("N\u01B0\u1EDBc Chanh Leo", 25000, "N\u01B0\u1EDBc chanh leo t\u01B0\u01A1i", c["\u0110\u1ED3 U\u1ED1ng"]),
            D("N\u01B0\u1EDBc \u00C9p Cam T\u01B0\u01A1i", 30000, "N\u01B0\u1EDBc \u00E9p cam t\u01B0\u01A1i nguy\u00EAn ch\u1EA5t", c["\u0110\u1ED3 U\u1ED1ng"]),
            D("N\u01B0\u1EDBc \u00C9p D\u01B0a H\u1EA5u", 30000, "N\u01B0\u1EDBc \u00E9p d\u01B0a h\u1EA5u t\u01B0\u01A1i", c["\u0110\u1ED3 U\u1ED1ng"]),
            D("Tr\u00E0 \u0110\u00E0o Cam S\u1EA3", 30000, "Tr\u00E0 \u0111\u00E0o cam s\u1EA3", c["\u0110\u1ED3 U\u1ED1ng"]),
            D("S\u1EEFa Chua \u0110\u00E1nh \u0110\u00E1", 30000, "S\u1EEFa chua \u0111\u00E1nh \u0111\u00E1 m\u00E1t l\u1EA1nh", c["\u0110\u1ED3 U\u1ED1ng"]),

            // Ruou Bia
            D("R\u01B0\u1EE3u D\u1EEBa", 60000, "R\u01B0\u1EE3u d\u1EEBa", c["R\u01B0\u1EE3u - Bia"]),
            D("R\u01B0\u1EE3u Tr\u1EAFng", 70000, "R\u01B0\u1EE3u tr\u1EAFng", c["R\u01B0\u1EE3u - Bia"]),
            D("R\u01B0\u1EE3u T\u00E1o M\u00E8o", 80000, "R\u01B0\u1EE3u t\u00E1o m\u00E8o", c["R\u01B0\u1EE3u - Bia"]),
            D("R\u01B0\u1EE3u M\u01A1", 80000, "R\u01B0\u1EE3u m\u01A1", c["R\u01B0\u1EE3u - Bia"]),
            D("R\u01B0\u1EE3u D\u00E2u T\u1EB1m", 80000, "R\u01B0\u1EE3u d\u00E2u t\u1EB1m", c["R\u01B0\u1EE3u - Bia"]),
            D("R\u01B0\u1EE3u Soju", 80000, "R\u01B0\u1EE3u Soju H\u00E0n Qu\u1ED1c", c["R\u01B0\u1EE3u - Bia"]),
            D("Bia Vi\u1EC7t", 20000, "Bia Vi\u1EC7t lon", c["R\u01B0\u1EE3u - Bia"]),
            D("Bia Chai Tiger B\u1EA1c", 25000, "Bia Tiger B\u1EA1c chai", c["R\u01B0\u1EE3u - Bia"]),
            D("Bia Chai Heineken", 25000, "Bia Heineken chai", c["R\u01B0\u1EE3u - Bia"]),
        };
    }

    private static Dish D(string name, decimal price, string desc, int catId)
        => new() { Name = name, Price = price, Description = desc, CategoryId = catId, Status = DishStatus.Available };

    private static List<Ingredient> CreateIngredients()
    {
        return new List<Ingredient>
        {
            I("Th\u1ECBt ba ch\u1EC9 l\u1EE3n", "kg", 50, 5),
            I("Th\u1ECBt s\u1EE5n l\u1EE3n", "kg", 30, 3),
            I("B\u00F2 ta (th\u1ECBt b\u00F2 Vi\u1EC7t)", "kg", 40, 5),
            I("Ba ch\u1EC9 b\u00F2 M\u1EF9", "kg", 30, 3),
            I("S\u01B0\u1EDDn non l\u1EE3n", "kg", 25, 3),
            I("S\u01B0\u1EDDn b\u00F2 M\u1EF9", "kg", 20, 2),
            I("L\u00F5i vai b\u00F2 M\u1EF9", "kg", 20, 2),
            I("B\u1EAFp hoa b\u00F2 M\u1EF9", "kg", 15, 2),
            I("L\u00F5i vai Oushi", "kg", 10, 1),
            I("Th\u0103n ngo\u1EA1i Oushi", "kg", 10, 1),
            I("Th\u1ECBt tr\u00E2u", "kg", 20, 2),
            I("Th\u1ECBt d\u00E0i l\u1EE3n", "kg", 25, 3),
            I("D\u1EA1 d\u00E0y l\u1EE3n", "kg", 15, 2),
            I("L\u00F2ng l\u1EE3n", "kg", 20, 2),
            I("Kh\u1EA5u \u0111u\u00F4i l\u1EE3n", "kg", 15, 2),
            I("Ch\u00E2n g\u00E0", "kg", 20, 2),
            I("X\u00FAc x\u00EDch", "kg", 20, 3),
            I("T\u00F4m t\u01B0\u01A1i", "kg", 25, 3),
            I("R\u00E2u m\u1EF1c", "kg", 20, 2),
            I("B\u1EA1ch tu\u1ED9c", "kg", 15, 2),
            I("M\u1EF1c tr\u1EE9ng", "kg", 15, 2),
            I("H\u00E0u", "kg", 15, 2),
            I("\u1ED0c m\u00F3ng tay", "kg", 15, 2),
            I("Ngao", "kg", 20, 3),
            I("Thanh cua", "kg", 10, 2),
            I("N\u1EA5m kim ch\u00E2m", "kg", 15, 2),
            I("N\u1EA5m c\u00E1c lo\u1EA1i", "kg", 15, 2),
            I("Rau t\u1ED5ng h\u1EE3p", "kg", 30, 5),
            I("C\u1EA3i cu\u1ED1n", "kg", 15, 2),
            I("V\u00E1ng \u0111\u1EADu", "kg", 10, 2),
            I("M\u00E8 (v\u1EEBng)", "kg", 5, 1),
            I("S\u1ED1t v\u1EEBng cay", "l\u00EDt", 5, 1),
            I("Sa t\u1EBF", "l\u00EDt", 5, 1),
            I("M\u1EE1 h\u00E0nh", "l\u00EDt", 5, 1),
            I("R\u01A1m kh\u00F4", "kg", 10, 2),
            I("Kim chi", "kg", 20, 3),
            I("D\u01B0a chu\u1ED9t", "kg", 15, 3),
            I("Rau salad", "kg", 10, 2),
            I("B\u00E1nh m\u1EF3", "c\u00E1i", 50, 10),
            I("B\u01A1 t\u1ECFi", "kg", 5, 1),
            I("Khoai t\u00E2y", "kg", 30, 5),
            I("Ng\u00F4", "kg", 15, 3),
            I("Khoai lang", "kg", 15, 3),
            I("Ph\u00F4 mai b\u1ED9t", "kg", 5, 1),
            I("X\u00FAc x\u00EDch ph\u00F4 mai", "kg", 10, 2),
            I("S\u1EE7i c\u1EA3o", "kg", 10, 2),
            I("Vi\u00EAn t\u00F4m h\u00F9m", "kg", 10, 2),
            I("\u0110\u1EADu h\u0169 ph\u00F4 mai", "kg", 10, 2),
            I("Vi\u00EAn th\u1EADp c\u1EA9m", "kg", 10, 2),
            I("N\u01B0\u1EDBc l\u1EA9u Th\u00E1i Tom Yum", "l\u00EDt", 30, 5),
            I("N\u01B0\u1EDBc kho\u00E1ng", "chai", 100, 20),
            I("Coca Cola lon", "lon", 100, 20),
            I("Cam Twister lon", "lon", 50, 10),
            I("Siro Coca", "l\u00EDt", 10, 2),
            I("Tr\u00E0 t\u00FAi l\u1ECDc", "g\u00F3i", 100, 20),
            I("Chanh t\u01B0\u01A1i", "kg", 10, 2),
            I("Qu\u1EA5t t\u01B0\u01A1i", "kg", 5, 1),
            I("S\u00E2m d\u1EE9a", "kg", 5, 1),
            I("Chanh leo", "kg", 5, 1),
            I("Cam t\u01B0\u01A1i", "kg", 10, 2),
            I("D\u01B0a h\u1EA5u", "kg", 15, 3),
            I("\u0110\u00E0o ng\u00E2m", "l\u00EDt", 5, 1),
            I("S\u1EA3 t\u01B0\u01A1i", "kg", 3, 1),
            I("S\u1EEFa chua", "kg", 5, 1),
            I("\u0110\u01B0\u1EDDng", "kg", 10, 2),
            I("\u0110\u00E1 vi\u00EAn", "kg", 50, 10),
            I("R\u01B0\u1EE3u d\u1EEBa", "chai", 20, 5),
            I("R\u01B0\u1EE3u tr\u1EAFng", "chai", 20, 5),
            I("R\u01B0\u1EE3u t\u00E1o m\u00E8o", "chai", 15, 3),
            I("R\u01B0\u1EE3u m\u01A1", "chai", 15, 3),
            I("R\u01B0\u1EE3u d\u00E2u t\u1EB1m", "chai", 15, 3),
            I("R\u01B0\u1EE3u Soju", "chai", 30, 5),
            I("Bia Vi\u1EC7t", "lon", 100, 20),
            I("Bia Tiger B\u1EA1c", "chai", 50, 10),
            I("Bia Heineken", "chai", 50, 10),
        };
    }

    private static Ingredient I(string name, string unit, decimal stock, decimal minStock)
        => new() { Name = name, Unit = unit, CurrentStock = stock, MinStock = minStock };

    private static List<DishIngredient> CreateRecipes(Dictionary<string, int> d, Dictionary<string, int> i)
    {
        var r = new List<DishIngredient>();
        void Add(string dish, string ing, decimal qty) =>
            r.Add(new DishIngredient { DishId = d[dish], IngredientId = i[ing], QuantityNeeded = qty });

        // Khai Vi
        Add("Kim Chi", "Kim chi", 0.15m);
        Add("D\u01B0a Chu\u1ED9t", "D\u01B0a chu\u1ED9t", 0.15m);
        Add("Salad", "Rau salad", 0.15m);
        Add("B\u00E1nh M\u1EF3 B\u01A1", "B\u00E1nh m\u1EF3", 1);
        Add("B\u00E1nh M\u1EF3 B\u01A1", "B\u01A1 t\u1ECFi", 0.03m);
        Add("Khoai T\u00E2y Chi\u00EAn", "Khoai t\u00E2y", 0.25m);
        Add("Ng\u00F4 Chi\u00EAn", "Ng\u00F4", 0.2m);
        Add("Khoai Lang K\u00E9n", "Khoai lang", 0.25m);
        Add("Khoai T\u00E2y L\u1EAFc Ph\u00F4 Mai", "Khoai t\u00E2y", 0.25m);
        Add("Khoai T\u00E2y L\u1EAFc Ph\u00F4 Mai", "Ph\u00F4 mai b\u1ED9t", 0.03m);

        // Thit Nuong
        Add("Ba Ch\u1EC9 \u01AF\u1EDBp M\u00E8", "Th\u1ECBt ba ch\u1EC9 l\u1EE3n", 0.25m);
        Add("Ba Ch\u1EC9 \u01AF\u1EDBp M\u00E8", "M\u00E8 (v\u1EEBng)", 0.01m);
        Add("B\u00F2 Ta S\u1ED1t V\u1EEBng Cay", "B\u00F2 ta (th\u1ECBt b\u00F2 Vi\u1EC7t)", 0.25m);
        Add("B\u00F2 Ta S\u1ED1t V\u1EEBng Cay", "S\u1ED1t v\u1EEBng cay", 0.03m);
        Add("B\u00F2 Ta Cu\u1ED1n C\u1EA3i", "B\u00F2 ta (th\u1ECBt b\u00F2 Vi\u1EC7t)", 0.25m);
        Add("B\u00F2 Ta Cu\u1ED1n C\u1EA3i", "C\u1EA3i cu\u1ED1n", 0.1m);
        Add("S\u01B0\u1EDDn Non N\u01B0\u1EDBng", "S\u01B0\u1EDDn non l\u1EE3n", 0.3m);
        Add("Th\u1ECBt S\u1EE5n N\u01B0\u1EDBng", "Th\u1ECBt s\u1EE5n l\u1EE3n", 0.25m);
        Add("Ba Ch\u1EC9 L\u1EE3n Thui R\u01A1m Th\u01A1m", "Th\u1ECBt ba ch\u1EC9 l\u1EE3n", 0.3m);
        Add("Ba Ch\u1EC9 L\u1EE3n Thui R\u01A1m Th\u01A1m", "R\u01A1m kh\u00F4", 0.1m);
        Add("Ba Ch\u1EC9 B\u00F2 M\u1EF9 Cu\u1ED1n N\u1EA5m Kim", "Ba ch\u1EC9 b\u00F2 M\u1EF9", 0.25m);
        Add("Ba Ch\u1EC9 B\u00F2 M\u1EF9 Cu\u1ED1n N\u1EA5m Kim", "N\u1EA5m kim ch\u00E2m", 0.05m);
        Add("N\u1EA5m N\u01B0\u1EDBng", "N\u1EA5m c\u00E1c lo\u1EA1i", 0.3m);
        Add("Th\u1ECBt D\u00E0i N\u01B0\u1EDBng", "Th\u1ECBt d\u00E0i l\u1EE3n", 0.25m);
        Add("B\u00F2 Ta N\u01B0\u1EDBng T\u1EA3ng", "B\u00F2 ta (th\u1ECBt b\u00F2 Vi\u1EC7t)", 0.3m);
        Add("S\u01B0\u1EDDn B\u00F2 M\u1EF9", "S\u01B0\u1EDDn b\u00F2 M\u1EF9", 0.3m);
        Add("L\u00F5i Vai B\u00F2 M\u1EF9", "L\u00F5i vai b\u00F2 M\u1EF9", 0.25m);
        Add("Ba Ch\u1EC9 B\u00F2 M\u1EF9", "Ba ch\u1EC9 b\u00F2 M\u1EF9", 0.25m);
        Add("Th\u1ECBt Tr\u00E2u N\u01B0\u1EDBng", "Th\u1ECBt tr\u00E2u", 0.25m);
        Add("B\u00F2 Ta Cu\u1ED1n N\u1EA5m Kim", "B\u00F2 ta (th\u1ECBt b\u00F2 Vi\u1EC7t)", 0.25m);
        Add("B\u00F2 Ta Cu\u1ED1n N\u1EA5m Kim", "N\u1EA5m kim ch\u00E2m", 0.05m);
        Add("B\u1EAFp Hoa B\u00F2 M\u1EF9", "B\u1EAFp hoa b\u00F2 M\u1EF9", 0.3m);
        Add("L\u00F5i Vai Oushi \u0110\u1EB7c Bi\u1EC7t", "L\u00F5i vai Oushi", 0.25m);
        Add("Th\u0103n Ngo\u1EA1i Oushi \u0110\u1EB7c Bi\u1EC7t", "Th\u0103n ngo\u1EA1i Oushi", 0.25m);

        // Hai San Nuong
        Add("T\u00F4m Nh\u1EA3y N\u01B0\u1EDBng", "T\u00F4m t\u01B0\u01A1i", 0.3m);
        Add("R\u00E2u M\u1EF1c N\u01B0\u1EDBng", "R\u00E2u m\u1EF1c", 0.25m);
        Add("B\u1EA1ch Tu\u1ED9c Sa T\u1EBF", "B\u1EA1ch tu\u1ED9c", 0.25m);
        Add("B\u1EA1ch Tu\u1ED9c Sa T\u1EBF", "Sa t\u1EBF", 0.02m);
        Add("M\u1EF1c Tr\u1EE9ng N\u01B0\u1EDBng", "M\u1EF1c tr\u1EE9ng", 0.3m);
        Add("H\u00E0u N\u01B0\u1EDBng M\u1EE1 H\u00E0nh", "H\u00E0u", 0.3m);
        Add("H\u00E0u N\u01B0\u1EDBng M\u1EE1 H\u00E0nh", "M\u1EE1 h\u00E0nh", 0.03m);
        Add("\u1ED0c M\u00F3ng Tay N\u01B0\u1EDBng", "\u1ED0c m\u00F3ng tay", 0.3m);
        Add("\u1ED0c M\u00F3ng Tay N\u01B0\u1EDBng", "M\u1EE1 h\u00E0nh", 0.02m);

        // Lai Rai
        Add("Th\u1ECBt Xi\u00EAn N\u01B0\u1EDBng", "Th\u1ECBt ba ch\u1EC9 l\u1EE3n", 0.15m);
        Add("X\u00FAc X\u00EDch N\u01B0\u1EDBng", "X\u00FAc x\u00EDch", 0.15m);
        Add("D\u1EA1 D\u00E0y N\u01B0\u1EDBng", "D\u1EA1 d\u00E0y l\u1EE3n", 0.25m);
        Add("Kh\u1EA5u \u0110u\u00F4i N\u01B0\u1EDBng", "Kh\u1EA5u \u0111u\u00F4i l\u1EE3n", 0.25m);
        Add("L\u00F2ng L\u1EE3n N\u01B0\u1EDBng", "L\u00F2ng l\u1EE3n", 0.25m);
        Add("Ch\u00E2n G\u00E0 R\u00FAt X\u01B0\u01A1ng", "Ch\u00E2n g\u00E0", 0.25m);
        Add("L\u00F2ng N\u01B0\u1EDBng Lai Rai", "L\u00F2ng l\u1EE3n", 0.25m);

        // Lau Set
        var lauNuoc = "N\u01B0\u1EDBc l\u1EA9u Th\u00E1i Tom Yum";
        var boTa = "B\u00F2 ta (th\u1ECBt b\u00F2 Vi\u1EC7t)";
        var baChi = "Th\u1ECBt ba ch\u1EC9 l\u1EE3n";
        var rau = "Rau t\u1ED5ng h\u1EE3p";
        var nam = "N\u1EA5m kim ch\u00E2m";

        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 2 Ng\u01B0\u1EDDi", lauNuoc, 1.5m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 2 Ng\u01B0\u1EDDi", boTa, 0.3m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 2 Ng\u01B0\u1EDDi", baChi, 0.2m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 2 Ng\u01B0\u1EDDi", rau, 0.3m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 2 Ng\u01B0\u1EDDi", nam, 0.1m);

        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 3 Ng\u01B0\u1EDDi", lauNuoc, 2m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 3 Ng\u01B0\u1EDDi", boTa, 0.4m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 3 Ng\u01B0\u1EDDi", baChi, 0.3m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 3 Ng\u01B0\u1EDDi", rau, 0.4m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 3 Ng\u01B0\u1EDDi", nam, 0.15m);

        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 4 Ng\u01B0\u1EDDi", lauNuoc, 2.5m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 4 Ng\u01B0\u1EDDi", boTa, 0.5m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 4 Ng\u01B0\u1EDDi", baChi, 0.4m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 4 Ng\u01B0\u1EDDi", rau, 0.5m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 4 Ng\u01B0\u1EDDi", nam, 0.2m);

        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 5 Ng\u01B0\u1EDDi", lauNuoc, 3m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 5 Ng\u01B0\u1EDDi", boTa, 0.6m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 5 Ng\u01B0\u1EDDi", baChi, 0.5m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 5 Ng\u01B0\u1EDDi", rau, 0.6m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 5 Ng\u01B0\u1EDDi", nam, 0.25m);

        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 6 Ng\u01B0\u1EDDi", lauNuoc, 3.5m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 6 Ng\u01B0\u1EDDi", boTa, 0.8m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 6 Ng\u01B0\u1EDDi", baChi, 0.6m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 6 Ng\u01B0\u1EDDi", rau, 0.7m);
        Add("L\u1EA9u Th\u00E1i Tom Yum - Set 6 Ng\u01B0\u1EDDi", nam, 0.3m);

        // Lau - Thit Goi Them
        Add("Th\u1ECBt S\u1EE5n (L\u1EA9u)", "Th\u1ECBt s\u1EE5n l\u1EE3n", 0.3m);
        Add("Ba Ch\u1EC9 B\u00F2 M\u1EF9 (L\u1EA9u)", "Ba ch\u1EC9 b\u00F2 M\u1EF9", 0.3m);
        Add("Th\u1ECBt B\u00F2 Ta (L\u1EA9u)", "B\u00F2 ta (th\u1ECBt b\u00F2 Vi\u1EC7t)", 0.3m);

        // Lau - Hai San Goi Them
        Add("Ngao (L\u1EA9u)", "Ngao", 0.3m);
        Add("Thanh Cua (L\u1EA9u)", "Thanh cua", 0.2m);
        Add("R\u00E2u M\u1EF1c (L\u1EA9u)", "R\u00E2u m\u1EF1c", 0.25m);
        Add("T\u00F4m (L\u1EA9u)", "T\u00F4m t\u01B0\u01A1i", 0.3m);
        Add("B\u1EA1ch Tu\u1ED9c (L\u1EA9u)", "B\u1EA1ch tu\u1ED9c", 0.25m);
        Add("M\u1EF1c Tr\u1EE9ng (L\u1EA9u)", "M\u1EF1c tr\u1EE9ng", 0.3m);

        // Vien Tha Lau & Rau
        Add("X\u00FAc X\u00EDch Th\u01B0\u1EDDng", "X\u00FAc x\u00EDch", 0.15m);
        Add("X\u00FAc X\u00EDch Ph\u00F4 Mai", "X\u00FAc x\u00EDch ph\u00F4 mai", 0.15m);
        Add("S\u1EE7i C\u1EA3o L\u1EA9u", "S\u1EE7i c\u1EA3o", 0.2m);
        Add("Vi\u00EAn T\u00F4m H\u00F9m", "Vi\u00EAn t\u00F4m h\u00F9m", 0.15m);
        Add("\u0110\u1EADu H\u0169 Ph\u00F4 Mai", "\u0110\u1EADu h\u0169 ph\u00F4 mai", 0.15m);
        Add("Vi\u00EAn Th\u1EADp C\u1EA9m", "Vi\u00EAn th\u1EADp c\u1EA9m", 0.2m);
        Add("Rau T\u1ED5ng H\u1EE3p", "Rau t\u1ED5ng h\u1EE3p", 0.3m);
        Add("V\u00E1ng \u0110\u1EADu / N\u1EA5m Kim", "V\u00E1ng \u0111\u1EADu", 0.1m);
        Add("V\u00E1ng \u0110\u1EADu / N\u1EA5m Kim", "N\u1EA5m kim ch\u00E2m", 0.1m);

        // Do Uong
        Add("N\u01B0\u1EDBc Kho\u00E1ng", "N\u01B0\u1EDBc kho\u00E1ng", 1);
        Add("Coca / Cam Twister Lon", "Coca Cola lon", 1);
        Add("Coca T\u01B0\u01A1i", "Siro Coca", 0.05m);
        Add("Coca T\u01B0\u01A1i", "\u0110\u00E1 vi\u00EAn", 0.2m);
        Add("Tr\u00E0 Chanh / Tr\u00E0 Qu\u1EA5t", "Tr\u00E0 t\u00FAi l\u1ECDc", 1);
        Add("Tr\u00E0 Chanh / Tr\u00E0 Qu\u1EA5t", "Chanh t\u01B0\u01A1i", 0.05m);
        Add("Tr\u00E0 Chanh / Tr\u00E0 Qu\u1EA5t", "\u0110\u01B0\u1EDDng", 0.02m);
        Add("Tr\u00E0 S\u00E2m D\u1EE9a", "S\u00E2m d\u1EE9a", 0.05m);
        Add("Tr\u00E0 S\u00E2m D\u1EE9a", "Tr\u00E0 t\u00FAi l\u1ECDc", 1);
        Add("N\u01B0\u1EDBc Chanh T\u01B0\u01A1i", "Chanh t\u01B0\u01A1i", 0.1m);
        Add("N\u01B0\u1EDBc Chanh T\u01B0\u01A1i", "\u0110\u01B0\u1EDDng", 0.03m);
        Add("N\u01B0\u1EDBc Chanh T\u01B0\u01A1i", "\u0110\u00E1 vi\u00EAn", 0.2m);
        Add("N\u01B0\u1EDBc Chanh Leo", "Chanh leo", 0.1m);
        Add("N\u01B0\u1EDBc Chanh Leo", "\u0110\u01B0\u1EDDng", 0.03m);
        Add("N\u01B0\u1EDBc \u00C9p Cam T\u01B0\u01A1i", "Cam t\u01B0\u01A1i", 0.3m);
        Add("N\u01B0\u1EDBc \u00C9p D\u01B0a H\u1EA5u", "D\u01B0a h\u1EA5u", 0.4m);
        Add("Tr\u00E0 \u0110\u00E0o Cam S\u1EA3", "\u0110\u00E0o ng\u00E2m", 0.05m);
        Add("Tr\u00E0 \u0110\u00E0o Cam S\u1EA3", "Cam t\u01B0\u01A1i", 0.1m);
        Add("Tr\u00E0 \u0110\u00E0o Cam S\u1EA3", "S\u1EA3 t\u01B0\u01A1i", 0.02m);
        Add("Tr\u00E0 \u0110\u00E0o Cam S\u1EA3", "Tr\u00E0 t\u00FAi l\u1ECDc", 1);
        Add("S\u1EEFa Chua \u0110\u00E1nh \u0110\u00E1", "S\u1EEFa chua", 0.15m);
        Add("S\u1EEFa Chua \u0110\u00E1nh \u0110\u00E1", "\u0110\u00E1 vi\u00EAn", 0.2m);

        // Ruou Bia
        Add("R\u01B0\u1EE3u D\u1EEBa", "R\u01B0\u1EE3u d\u1EEBa", 1);
        Add("R\u01B0\u1EE3u Tr\u1EAFng", "R\u01B0\u1EE3u tr\u1EAFng", 1);
        Add("R\u01B0\u1EE3u T\u00E1o M\u00E8o", "R\u01B0\u1EE3u t\u00E1o m\u00E8o", 1);
        Add("R\u01B0\u1EE3u M\u01A1", "R\u01B0\u1EE3u m\u01A1", 1);
        Add("R\u01B0\u1EE3u D\u00E2u T\u1EB1m", "R\u01B0\u1EE3u d\u00E2u t\u1EB1m", 1);
        Add("R\u01B0\u1EE3u Soju", "R\u01B0\u1EE3u Soju", 1);
        Add("Bia Vi\u1EC7t", "Bia Vi\u1EC7t", 1);
        Add("Bia Chai Tiger B\u1EA1c", "Bia Tiger B\u1EA1c", 1);
        Add("Bia Chai Heineken", "Bia Heineken", 1);

        return r;
    }

    // ===== REVIEWS =====
    // Seed 1-3 đánh giá cho mỗi món, đa phần là tốt (4-5 sao), xen kẽ vài đánh giá 3 sao.
    // Idempotent & an toàn: chỉ thêm review cho món CHƯA có review nào -> giữ nguyên
    // review thật của khách, và chạy lại nhiều lần không tạo bản trùng.
    private static void SeedReviews(AppDbContext context)
    {
        var dishes = context.Dishes.OrderBy(d => d.Id).ToList();
        if (dishes.Count == 0) return;

        // Bỏ qua những món đã có sẵn review (vd review thật của khách)
        var dishesWithReview = context.DishReviews.Select(r => r.DishId).Distinct().ToHashSet();
        var targets = dishes.Where(d => !dishesWithReview.Contains(d.Id)).ToList();
        if (targets.Count == 0) return;

        // Tên khách ẩn danh
        var names = new[]
        {
            "Minh Anh", "Quang Huy", "Thu Hà", "Đức Anh", "Phương Linh", "Tuấn Kiệt",
            "Ngọc Mai", "Hoàng Nam", "Thanh Tâm", "Bảo Châu", "Việt Hưng", "Khánh Vy",
            "Gia Bảo", "Hải Đăng", "Mỹ Duyên", "Trọng Nghĩa", "Lan Hương", "Đình Phong",
        };

        // Bình luận 5 sao (rất tốt) - viết chung chung để hợp mọi món, kể cả đồ uống
        var good5 = new[]
        {
            "Món ăn rất ngon, mình sẽ quay lại!",
            "Chất lượng tuyệt vời, đáng đồng tiền.",
            "Ngon xuất sắc, cả nhà đều thích.",
            "Phục vụ nhanh, đồ nóng hổi và ngon.",
            "Quá ngon, không có gì để chê.",
            "Hương vị đậm đà, rất hài lòng.",
            "10 điểm, sẽ giới thiệu cho bạn bè.",
            "Tươi ngon, trình bày đẹp mắt.",
        };

        // Bình luận 4 sao (tốt)
        var good4 = new[]
        {
            "Ngon, giá hợp lý.",
            "Khá ổn, sẽ thử lại lần sau.",
            "Đồ ăn ngon, nhân viên thân thiện.",
            "Ngon nhưng phần hơi ít một chút.",
            "Tốt, đáng để thử.",
            "Hài lòng với chất lượng.",
        };

        // Bình luận 3 sao (tạm ổn) - chiếm thiểu số
        var ok3 = new[]
        {
            "Tạm ổn, hơi mặn một chút.",
            "Bình thường, không có gì đặc biệt.",
            "Ổn nhưng phải chờ hơi lâu.",
            "Được, nhưng có thể ngon hơn.",
        };

        var reviews = new List<DishReview>();
        for (int idx = 0; idx < targets.Count; idx++)
        {
            var dish = targets[idx];
            int count = 1 + (idx % 3); // 1, 2, 3 luân phiên -> trung bình 2 review/món

            for (int k = 0; k < count; k++)
            {
                int seed = idx * 7 + k * 13;       // số giả ngẫu nhiên xác định (tái lập được)
                int bucket = (idx * 3 + k) % 10;    // 0..9 -> quyết định số sao

                int rating;
                string comment;
                if (bucket == 0)        { rating = 3; comment = ok3[seed % ok3.Length]; }     // ~10% (3 sao)
                else if (bucket <= 3)   { rating = 4; comment = good4[seed % good4.Length]; } // ~30% (4 sao)
                else                    { rating = 5; comment = good5[seed % good5.Length]; } // ~60% (5 sao)

                reviews.Add(new DishReview
                {
                    DishId = dish.Id,
                    GuestName = names[seed % names.Length],
                    TableNumber = 1 + (seed % 20),
                    Rating = rating,
                    Comment = comment,
                    // Trải đánh giá trong ~2 tháng gần đây cho thực tế
                    CreatedAt = DateTime.UtcNow.AddDays(-(seed % 60)).AddHours(-(seed % 24)),
                });
            }
        }

        context.DishReviews.AddRange(reviews);
        context.SaveChanges();
    }
}
