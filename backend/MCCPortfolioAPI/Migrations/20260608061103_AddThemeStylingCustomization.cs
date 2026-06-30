using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MCCPortfolioAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddThemeStylingCustomization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FontFamily",
                table: "ThemeConfigs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PrimaryColor",
                table: "ThemeConfigs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SecondaryColor",
                table: "ThemeConfigs",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FontFamily",
                table: "ThemeConfigs");

            migrationBuilder.DropColumn(
                name: "PrimaryColor",
                table: "ThemeConfigs");

            migrationBuilder.DropColumn(
                name: "SecondaryColor",
                table: "ThemeConfigs");
        }
    }
}
