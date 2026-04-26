using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kondix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionAndSetFeedbackFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "feedback_reviewed_at",
                schema: "kondix",
                table: "workout_sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "mood",
                schema: "kondix",
                table: "workout_sessions",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "notes",
                schema: "kondix",
                table: "set_logs",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "exercise_feedback",
                schema: "kondix",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    exercise_id = table.Column<Guid>(type: "uuid", nullable: false),
                    actual_rpe = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_exercise_feedback", x => x.id);
                    table.ForeignKey(
                        name: "fk_exercise_feedback_exercises_exercise_id",
                        column: x => x.exercise_id,
                        principalSchema: "kondix",
                        principalTable: "exercises",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_exercise_feedback_workout_sessions_session_id",
                        column: x => x.session_id,
                        principalSchema: "kondix",
                        principalTable: "workout_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_student_id_completed_at",
                schema: "kondix",
                table: "workout_sessions",
                columns: new[] { "student_id", "completed_at" },
                filter: "\"feedback_reviewed_at\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_exercise_feedback_exercise_id_created_at",
                schema: "kondix",
                table: "exercise_feedback",
                columns: new[] { "exercise_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_exercise_feedback_session_id_exercise_id",
                schema: "kondix",
                table: "exercise_feedback",
                columns: new[] { "session_id", "exercise_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "exercise_feedback",
                schema: "kondix");

            migrationBuilder.DropIndex(
                name: "ix_workout_sessions_student_id_completed_at",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "feedback_reviewed_at",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "mood",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "notes",
                schema: "kondix",
                table: "set_logs");
        }
    }
}
