using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CelvoGym.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPRsBodyMetricsAnalyticsTagsPhase3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "category",
                schema: "gym",
                table: "routines",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "tags",
                schema: "gym",
                table: "routines",
                type: "text[]",
                nullable: false,
                defaultValueSql: "ARRAY[]::text[]");

            migrationBuilder.CreateTable(
                name: "body_metrics",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recorded_at = table.Column<DateOnly>(type: "date", nullable: false),
                    weight = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    body_fat = table.Column<decimal>(type: "numeric(4,1)", precision: 4, scale: 1, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_body_metrics", x => x.id);
                    table.ForeignKey(
                        name: "fk_body_metrics_students_student_id",
                        column: x => x.student_id,
                        principalSchema: "gym",
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "personal_records",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    exercise_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    weight = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    reps = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    achieved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_personal_records", x => x.id);
                    table.ForeignKey(
                        name: "fk_personal_records_students_student_id",
                        column: x => x.student_id,
                        principalSchema: "gym",
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_personal_records_workout_sessions_session_id",
                        column: x => x.session_id,
                        principalSchema: "gym",
                        principalTable: "workout_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "progress_photos",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    taken_at = table.Column<DateOnly>(type: "date", nullable: false),
                    photo_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    angle = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_progress_photos", x => x.id);
                    table.ForeignKey(
                        name: "fk_progress_photos_students_student_id",
                        column: x => x.student_id,
                        principalSchema: "gym",
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "body_measurements",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    body_metric_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    value = table.Column<decimal>(type: "numeric(5,1)", precision: 5, scale: 1, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_body_measurements", x => x.id);
                    table.ForeignKey(
                        name: "fk_body_measurements_body_metrics_body_metric_id",
                        column: x => x.body_metric_id,
                        principalSchema: "gym",
                        principalTable: "body_metrics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_body_measurements_body_metric_id",
                schema: "gym",
                table: "body_measurements",
                column: "body_metric_id");

            migrationBuilder.CreateIndex(
                name: "ix_body_metrics_student_id_recorded_at",
                schema: "gym",
                table: "body_metrics",
                columns: new[] { "student_id", "recorded_at" });

            migrationBuilder.CreateIndex(
                name: "ix_personal_records_session_id",
                schema: "gym",
                table: "personal_records",
                column: "session_id");

            migrationBuilder.CreateIndex(
                name: "ix_personal_records_student_id_exercise_name",
                schema: "gym",
                table: "personal_records",
                columns: new[] { "student_id", "exercise_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_progress_photos_student_id_taken_at",
                schema: "gym",
                table: "progress_photos",
                columns: new[] { "student_id", "taken_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "body_measurements",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "personal_records",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "progress_photos",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "body_metrics",
                schema: "gym");

            migrationBuilder.DropColumn(
                name: "category",
                schema: "gym",
                table: "routines");

            migrationBuilder.DropColumn(
                name: "tags",
                schema: "gym",
                table: "routines");
        }
    }
}
