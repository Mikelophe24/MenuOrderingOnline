using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineMenu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDishNutrition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Calories",
                table: "Dishes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Carbs",
                table: "Dishes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Protein",
                table: "Dishes",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Calories",
                table: "Dishes");

            migrationBuilder.DropColumn(
                name: "Carbs",
                table: "Dishes");

            migrationBuilder.DropColumn(
                name: "Protein",
                table: "Dishes");
        }
    }
}
