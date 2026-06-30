using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MCCPortfolioAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddThemeAndApprovalToProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "Profiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SelectedTheme",
                table: "Profiles",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "SelectedTheme",
                table: "Profiles");
        }
    }
}
