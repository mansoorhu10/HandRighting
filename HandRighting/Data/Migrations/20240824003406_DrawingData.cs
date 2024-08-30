using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HandRighting.Data.Migrations
{
    /// <inheritdoc />
    public partial class DrawingData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DrawingData",
                table: "Page",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DrawingData",
                table: "Page");
        }
    }
}
