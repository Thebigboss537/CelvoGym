using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kondix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionRecoveryFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_recovery",
                schema: "kondix",
                table: "workout_sessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "recovers_session_id",
                schema: "kondix",
                table: "workout_sessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_recovers_session_id",
                schema: "kondix",
                table: "workout_sessions",
                column: "recovers_session_id");

            migrationBuilder.AddForeignKey(
                name: "fk_workout_sessions_workout_sessions_recovers_session_id",
                schema: "kondix",
                table: "workout_sessions",
                column: "recovers_session_id",
                principalSchema: "kondix",
                principalTable: "workout_sessions",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_workout_sessions_workout_sessions_recovers_session_id",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropIndex(
                name: "ix_workout_sessions_recovers_session_id",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "is_recovery",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "recovers_session_id",
                schema: "kondix",
                table: "workout_sessions");
        }
    }
}
