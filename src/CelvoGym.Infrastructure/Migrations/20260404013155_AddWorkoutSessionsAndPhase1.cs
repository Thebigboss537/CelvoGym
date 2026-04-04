using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CelvoGym.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutSessionsAndPhase1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_set_logs_exercise_sets_set_id",
                schema: "gym",
                table: "set_logs");

            migrationBuilder.DropIndex(
                name: "ix_set_logs_student_id_set_id",
                schema: "gym",
                table: "set_logs");

            migrationBuilder.AlterColumn<Guid>(
                name: "set_id",
                schema: "gym",
                table: "set_logs",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "session_id",
                schema: "gym",
                table: "set_logs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "snapshot_exercise_name",
                schema: "gym",
                table: "set_logs",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "snapshot_target_reps",
                schema: "gym",
                table: "set_logs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "snapshot_target_weight",
                schema: "gym",
                table: "set_logs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<List<int>>(
                name: "scheduled_days",
                schema: "gym",
                table: "routine_assignments",
                type: "integer[]",
                nullable: false,
                defaultValueSql: "ARRAY[]::integer[]");

            migrationBuilder.CreateTable(
                name: "trainer_notes",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    trainer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    is_pinned = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_trainer_notes", x => x.id);
                    table.ForeignKey(
                        name: "fk_trainer_notes_students_student_id",
                        column: x => x.student_id,
                        principalSchema: "gym",
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_trainer_notes_trainers_trainer_id",
                        column: x => x.trainer_id,
                        principalSchema: "gym",
                        principalTable: "trainers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "workout_sessions",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assignment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_id = table.Column<Guid>(type: "uuid", nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workout_sessions", x => x.id);
                    table.ForeignKey(
                        name: "fk_workout_sessions_days_day_id",
                        column: x => x.day_id,
                        principalSchema: "gym",
                        principalTable: "days",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workout_sessions_routine_assignments_assignment_id",
                        column: x => x.assignment_id,
                        principalSchema: "gym",
                        principalTable: "routine_assignments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_workout_sessions_routines_routine_id",
                        column: x => x.routine_id,
                        principalSchema: "gym",
                        principalTable: "routines",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workout_sessions_students_student_id",
                        column: x => x.student_id,
                        principalSchema: "gym",
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_set_logs_session_id_set_id",
                schema: "gym",
                table: "set_logs",
                columns: new[] { "session_id", "set_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_trainer_notes_student_id",
                schema: "gym",
                table: "trainer_notes",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "ix_trainer_notes_trainer_id_student_id",
                schema: "gym",
                table: "trainer_notes",
                columns: new[] { "trainer_id", "student_id" });

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_assignment_id",
                schema: "gym",
                table: "workout_sessions",
                column: "assignment_id");

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_day_id",
                schema: "gym",
                table: "workout_sessions",
                column: "day_id");

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_routine_id",
                schema: "gym",
                table: "workout_sessions",
                column: "routine_id");

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_student_id_assignment_id",
                schema: "gym",
                table: "workout_sessions",
                columns: new[] { "student_id", "assignment_id" });

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_student_id_routine_id_day_id",
                schema: "gym",
                table: "workout_sessions",
                columns: new[] { "student_id", "routine_id", "day_id" });

            migrationBuilder.AddForeignKey(
                name: "fk_set_logs_exercise_sets_set_id",
                schema: "gym",
                table: "set_logs",
                column: "set_id",
                principalSchema: "gym",
                principalTable: "exercise_sets",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            // Data migration: create synthetic WorkoutSessions for existing SetLogs
            migrationBuilder.Sql(@"
                INSERT INTO gym.workout_sessions (id, student_id, assignment_id, routine_id, day_id, started_at, completed_at, created_at)
                SELECT DISTINCT
                    gen_random_uuid(),
                    sl.student_id,
                    ra.id,
                    sl.routine_id,
                    (SELECT d.id FROM gym.days d WHERE d.routine_id = sl.routine_id ORDER BY d.sort_order LIMIT 1),
                    COALESCE(sl.completed_at, sl.created_at),
                    COALESCE(sl.completed_at, sl.created_at),
                    sl.created_at
                FROM gym.set_logs sl
                INNER JOIN gym.routine_assignments ra ON ra.routine_id = sl.routine_id AND ra.student_id = sl.student_id
                WHERE sl.session_id = '00000000-0000-0000-0000-000000000000';
            ");

            // Backfill session_id on existing SetLogs
            migrationBuilder.Sql(@"
                UPDATE gym.set_logs sl
                SET session_id = ws.id
                FROM gym.workout_sessions ws
                WHERE sl.session_id = '00000000-0000-0000-0000-000000000000'
                  AND ws.student_id = sl.student_id
                  AND ws.routine_id = sl.routine_id;
            ");

            // Delete any orphaned set_logs that couldn't be matched (no assignment exists)
            migrationBuilder.Sql(@"
                DELETE FROM gym.set_logs
                WHERE session_id = '00000000-0000-0000-0000-000000000000';
            ");

            migrationBuilder.AddForeignKey(
                name: "fk_set_logs_workout_sessions_session_id",
                schema: "gym",
                table: "set_logs",
                column: "session_id",
                principalSchema: "gym",
                principalTable: "workout_sessions",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_set_logs_exercise_sets_set_id",
                schema: "gym",
                table: "set_logs");

            migrationBuilder.DropForeignKey(
                name: "fk_set_logs_workout_sessions_session_id",
                schema: "gym",
                table: "set_logs");

            migrationBuilder.DropTable(
                name: "trainer_notes",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "workout_sessions",
                schema: "gym");

            migrationBuilder.DropIndex(
                name: "ix_set_logs_session_id_set_id",
                schema: "gym",
                table: "set_logs");

            migrationBuilder.DropColumn(
                name: "session_id",
                schema: "gym",
                table: "set_logs");

            migrationBuilder.DropColumn(
                name: "snapshot_exercise_name",
                schema: "gym",
                table: "set_logs");

            migrationBuilder.DropColumn(
                name: "snapshot_target_reps",
                schema: "gym",
                table: "set_logs");

            migrationBuilder.DropColumn(
                name: "snapshot_target_weight",
                schema: "gym",
                table: "set_logs");

            migrationBuilder.DropColumn(
                name: "scheduled_days",
                schema: "gym",
                table: "routine_assignments");

            migrationBuilder.AlterColumn<Guid>(
                name: "set_id",
                schema: "gym",
                table: "set_logs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_set_logs_student_id_set_id",
                schema: "gym",
                table: "set_logs",
                columns: new[] { "student_id", "set_id" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_set_logs_exercise_sets_set_id",
                schema: "gym",
                table: "set_logs",
                column: "set_id",
                principalSchema: "gym",
                principalTable: "exercise_sets",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
