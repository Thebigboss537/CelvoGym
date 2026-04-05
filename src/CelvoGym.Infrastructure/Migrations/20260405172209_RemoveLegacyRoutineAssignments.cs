using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CelvoGym.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLegacyRoutineAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_assignment_templates_routines_routine_id",
                schema: "gym",
                table: "assignment_templates");

            migrationBuilder.DropForeignKey(
                name: "fk_workout_sessions_routine_assignments_assignment_id",
                schema: "gym",
                table: "workout_sessions");

            migrationBuilder.DropTable(
                name: "routine_assignments",
                schema: "gym");

            migrationBuilder.DropIndex(
                name: "ix_workout_sessions_assignment_id",
                schema: "gym",
                table: "workout_sessions");

            migrationBuilder.DropIndex(
                name: "ix_workout_sessions_student_id_assignment_id",
                schema: "gym",
                table: "workout_sessions");

            migrationBuilder.DropIndex(
                name: "ix_assignment_templates_routine_id",
                schema: "gym",
                table: "assignment_templates");

            migrationBuilder.DropColumn(
                name: "assignment_id",
                schema: "gym",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "routine_id",
                schema: "gym",
                table: "assignment_templates");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "assignment_id",
                schema: "gym",
                table: "workout_sessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "routine_id",
                schema: "gym",
                table: "assignment_templates",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "routine_assignments",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    program_id = table.Column<Guid>(type: "uuid", nullable: true),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    deactivated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    scheduled_days = table.Column<List<int>>(type: "integer[]", nullable: false, defaultValueSql: "ARRAY[]::integer[]"),
                    start_date = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_routine_assignments", x => x.id);
                    table.ForeignKey(
                        name: "fk_routine_assignments_programs_program_id",
                        column: x => x.program_id,
                        principalSchema: "gym",
                        principalTable: "programs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_routine_assignments_routines_routine_id",
                        column: x => x.routine_id,
                        principalSchema: "gym",
                        principalTable: "routines",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_routine_assignments_students_student_id",
                        column: x => x.student_id,
                        principalSchema: "gym",
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_assignment_id",
                schema: "gym",
                table: "workout_sessions",
                column: "assignment_id");

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_student_id_assignment_id",
                schema: "gym",
                table: "workout_sessions",
                columns: new[] { "student_id", "assignment_id" });

            migrationBuilder.CreateIndex(
                name: "ix_assignment_templates_routine_id",
                schema: "gym",
                table: "assignment_templates",
                column: "routine_id");

            migrationBuilder.CreateIndex(
                name: "ix_routine_assignments_program_id",
                schema: "gym",
                table: "routine_assignments",
                column: "program_id");

            migrationBuilder.CreateIndex(
                name: "ix_routine_assignments_routine_id_student_id",
                schema: "gym",
                table: "routine_assignments",
                columns: new[] { "routine_id", "student_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_routine_assignments_student_id",
                schema: "gym",
                table: "routine_assignments",
                column: "student_id");

            migrationBuilder.AddForeignKey(
                name: "fk_assignment_templates_routines_routine_id",
                schema: "gym",
                table: "assignment_templates",
                column: "routine_id",
                principalSchema: "gym",
                principalTable: "routines",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_workout_sessions_routine_assignments_assignment_id",
                schema: "gym",
                table: "workout_sessions",
                column: "assignment_id",
                principalSchema: "gym",
                principalTable: "routine_assignments",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
