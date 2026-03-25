using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineMenu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderItemSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DishImage",
                table: "OrderItems",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DishName",
                table: "OrderItems",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "DishPrice",
                table: "OrderItems",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DishImage",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "DishName",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "DishPrice",
                table: "OrderItems");
        }
    }
}
