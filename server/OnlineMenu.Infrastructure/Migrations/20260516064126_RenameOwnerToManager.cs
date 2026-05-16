using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineMenu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameOwnerToManager : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Accounts SET Role = 'Manager' WHERE Role = 'Owner'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Accounts SET Role = 'Owner' WHERE Role = 'Manager'");
        }
    }
}
