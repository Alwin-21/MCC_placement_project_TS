using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MCCPortfolioAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddAlumniTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CurrentCompany",
                table: "Profiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CurrentJobTitle",
                table: "Profiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "GraduationYear",
                table: "Profiles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HigherStudyProgram",
                table: "Profiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HigherStudyUniversity",
                table: "Profiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsAlumni",
                table: "Profiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentCompany",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "CurrentJobTitle",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "GraduationYear",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "HigherStudyProgram",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "HigherStudyUniversity",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "IsAlumni",
                table: "Profiles");
        }
    }
}
