using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CelvoGym.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProgramAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_workout_sessions_routine_assignments_assignment_id",
                schema: "gym",
                table: "workout_sessions");

            migrationBuilder.AlterColumn<Guid>(
                name: "assignment_id",
                schema: "gym",
                table: "workout_sessions",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "program_assignment_id",
                schema: "gym",
                table: "workout_sessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "program_assignments",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    program_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    mode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    training_days = table.Column<List<int>>(type: "integer[]", nullable: false, defaultValueSql: "ARRAY[]::integer[]"),
                    fixed_schedule_json = table.Column<string>(type: "jsonb", nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    rotation_index = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_program_assignments", x => x.id);
                    table.ForeignKey(
                        name: "fk_program_assignments_programs_program_id",
                        column: x => x.program_id,
                        principalSchema: "gym",
                        principalTable: "programs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_program_assignments_students_student_id",
                        column: x => x.student_id,
                        principalSchema: "gym",
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_program_assignment_id",
                schema: "gym",
                table: "workout_sessions",
                column: "program_assignment_id");

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_student_id_program_assignment_id",
                schema: "gym",
                table: "workout_sessions",
                columns: new[] { "student_id", "program_assignment_id" });

            migrationBuilder.CreateIndex(
                name: "ix_program_assignments_program_id_student_id",
                schema: "gym",
                table: "program_assignments",
                columns: new[] { "program_id", "student_id" },
                unique: true,
                filter: "status = 'Active'");

            migrationBuilder.CreateIndex(
                name: "ix_program_assignments_student_id",
                schema: "gym",
                table: "program_assignments",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "ix_program_assignments_student_id_status",
                schema: "gym",
                table: "program_assignments",
                columns: new[] { "student_id", "status" });

            migrationBuilder.AddForeignKey(
                name: "fk_workout_sessions_program_assignments_program_assignment_id",
                schema: "gym",
                table: "workout_sessions",
                column: "program_assignment_id",
                principalSchema: "gym",
                principalTable: "program_assignments",
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

            // Data migration: convert existing RoutineAssignments with ProgramId
            migrationBuilder.Sql("""
                INSERT INTO gym.program_assignments (id, program_id, student_id, mode, training_days, start_date, end_date, status, created_at)
                SELECT
                    gen_random_uuid(),
                    ra.program_id,
                    ra.student_id,
                    'Rotation',
                    ra.scheduled_days,
                    COALESCE(ra.start_date, CURRENT_DATE),
                    COALESCE(ra.end_date, CURRENT_DATE + INTERVAL '8 weeks'),
                    CASE WHEN ra.is_active THEN 'Active' ELSE 'Completed' END,
                    ra.created_at
                FROM gym.routine_assignments ra
                WHERE ra.program_id IS NOT NULL
                ON CONFLICT DO NOTHING;
                """);

            // Link existing WorkoutSessions to new ProgramAssignments
            migrationBuilder.Sql("""
                UPDATE gym.workout_sessions ws
                SET program_assignment_id = pa.id
                FROM gym.routine_assignments ra
                JOIN gym.program_assignments pa ON pa.program_id = ra.program_id AND pa.student_id = ra.student_id
                WHERE ws.assignment_id = ra.id AND ra.program_id IS NOT NULL;
                """);

            // Create wrapper programs for orphan active RoutineAssignments (no ProgramId)
            migrationBuilder.Sql("""
                WITH orphan_assignments AS (
                    SELECT ra.id as ra_id, ra.routine_id, ra.student_id, ra.scheduled_days,
                           ra.start_date, ra.created_at, r.trainer_id, r.name as routine_name
                    FROM gym.routine_assignments ra
                    JOIN gym.routines r ON r.id = ra.routine_id
                    WHERE ra.program_id IS NULL AND ra.is_active = true
                ),
                new_programs AS (
                    INSERT INTO gym.programs (id, trainer_id, name, duration_weeks, is_active, updated_at, created_at)
                    SELECT DISTINCT ON (oa.routine_id, oa.routine_name)
                        gen_random_uuid(), oa.trainer_id,
                        'Programa de ' || oa.routine_name, 52, true, NOW(), NOW()
                    FROM orphan_assignments oa
                    RETURNING id, name
                ),
                new_program_routines AS (
                    INSERT INTO gym.program_routines (id, program_id, routine_id, sort_order, created_at)
                    SELECT gen_random_uuid(), np.id, r.id, 0, NOW()
                    FROM new_programs np
                    JOIN gym.routines r ON np.name = 'Programa de ' || r.name
                    RETURNING program_id, routine_id
                )
                INSERT INTO gym.program_assignments (id, program_id, student_id, mode, training_days, start_date, end_date, status, created_at)
                SELECT gen_random_uuid(), npr.program_id, oa.student_id, 'Rotation',
                       oa.scheduled_days, COALESCE(oa.start_date, CURRENT_DATE),
                       COALESCE(oa.start_date, CURRENT_DATE) + INTERVAL '52 weeks', 'Active', oa.created_at
                FROM orphan_assignments oa
                JOIN new_program_routines npr ON npr.routine_id = oa.routine_id
                ON CONFLICT DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_workout_sessions_program_assignments_program_assignment_id",
                schema: "gym",
                table: "workout_sessions");

            migrationBuilder.DropForeignKey(
                name: "fk_workout_sessions_routine_assignments_assignment_id",
                schema: "gym",
                table: "workout_sessions");

            migrationBuilder.DropTable(
                name: "program_assignments",
                schema: "gym");

            migrationBuilder.DropIndex(
                name: "ix_workout_sessions_program_assignment_id",
                schema: "gym",
                table: "workout_sessions");

            migrationBuilder.DropIndex(
                name: "ix_workout_sessions_student_id_program_assignment_id",
                schema: "gym",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "program_assignment_id",
                schema: "gym",
                table: "workout_sessions");

            migrationBuilder.AlterColumn<Guid>(
                name: "assignment_id",
                schema: "gym",
                table: "workout_sessions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "fk_workout_sessions_routine_assignments_assignment_id",
                schema: "gym",
                table: "workout_sessions",
                column: "assignment_id",
                principalSchema: "gym",
                principalTable: "routine_assignments",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
