using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kondix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ProgramsV3Refactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Destructive wipe: Programs v3 is greenfield. Existing program/assignment/session
            // data is removed before schema reshape. Confirmed acceptable by product owner
            // because prod is currently a testing environment.
            migrationBuilder.Sql(@"
                TRUNCATE TABLE kondix.set_logs CASCADE;
                TRUNCATE TABLE kondix.personal_records CASCADE;
                TRUNCATE TABLE kondix.workout_sessions CASCADE;
                TRUNCATE TABLE kondix.program_assignments CASCADE;
                TRUNCATE TABLE kondix.programs CASCADE;
            ");

            migrationBuilder.DropForeignKey(
                name: "fk_program_assignments_students_student_id",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropForeignKey(
                name: "fk_programs_trainers_trainer_id",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropForeignKey(
                name: "fk_workout_sessions_program_assignments_program_assignment_id",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropTable(
                name: "program_routines",
                schema: "kondix");

            migrationBuilder.DropTable(
                name: "program_week_overrides",
                schema: "kondix");

            migrationBuilder.DropIndex(
                name: "ix_workout_sessions_program_assignment_id",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropIndex(
                name: "ix_workout_sessions_student_id_program_assignment_id",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropIndex(
                name: "ix_program_assignments_program_id_student_id",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropIndex(
                name: "ix_program_assignments_student_id",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropColumn(
                name: "program_assignment_id",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "duration_weeks",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropColumn(
                name: "is_active",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropColumn(
                name: "completed_at",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropColumn(
                name: "end_date",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropColumn(
                name: "fixed_schedule_json",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropColumn(
                name: "mode",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropColumn(
                name: "rotation_index",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropColumn(
                name: "training_days",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.AddColumn<Guid>(
                name: "assignment_id",
                schema: "kondix",
                table: "workout_sessions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "program_id",
                schema: "kondix",
                table: "workout_sessions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateOnly>(
                name: "recovers_planned_date",
                schema: "kondix",
                table: "workout_sessions",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "rpe",
                schema: "kondix",
                table: "workout_sessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "slot_index",
                schema: "kondix",
                table: "workout_sessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "status",
                schema: "kondix",
                table: "workout_sessions",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                schema: "kondix",
                table: "workout_sessions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<int>(
                name: "week_index",
                schema: "kondix",
                table: "workout_sessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "kondix",
                table: "programs",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "created_at",
                schema: "kondix",
                table: "programs",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.AlterColumn<Guid>(
                name: "id",
                schema: "kondix",
                table: "programs",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldDefaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<int>(
                name: "days_per_week",
                schema: "kondix",
                table: "programs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_published",
                schema: "kondix",
                table: "programs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "level",
                schema: "kondix",
                table: "programs",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "mode",
                schema: "kondix",
                table: "programs",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "notes",
                schema: "kondix",
                table: "programs",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "objective",
                schema: "kondix",
                table: "programs",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "schedule_type",
                schema: "kondix",
                table: "programs",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                schema: "kondix",
                table: "program_assignments",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Active");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "start_date",
                schema: "kondix",
                table: "program_assignments",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateOnly),
                oldType: "date");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "created_at",
                schema: "kondix",
                table: "program_assignments",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.AlterColumn<Guid>(
                name: "id",
                schema: "kondix",
                table: "program_assignments",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldDefaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "trainer_id",
                schema: "kondix",
                table: "program_assignments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                schema: "kondix",
                table: "program_assignments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.CreateTable(
                name: "program_weeks",
                schema: "kondix",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    program_id = table.Column<Guid>(type: "uuid", nullable: false),
                    week_index = table.Column<int>(type: "integer", nullable: false),
                    label = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_program_weeks", x => x.id);
                    table.ForeignKey(
                        name: "fk_program_weeks_programs_program_id",
                        column: x => x.program_id,
                        principalSchema: "kondix",
                        principalTable: "programs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "program_slots",
                schema: "kondix",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    week_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_index = table.Column<int>(type: "integer", nullable: false),
                    kind = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: true),
                    day_id = table.Column<Guid>(type: "uuid", nullable: true),
                    block_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_program_slots", x => x.id);
                    table.ForeignKey(
                        name: "fk_program_slots_days_day_id",
                        column: x => x.day_id,
                        principalSchema: "kondix",
                        principalTable: "days",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_program_slots_program_weeks_week_id",
                        column: x => x.week_id,
                        principalSchema: "kondix",
                        principalTable: "program_weeks",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_program_slots_routines_routine_id",
                        column: x => x.routine_id,
                        principalSchema: "kondix",
                        principalTable: "routines",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_assignment_id_week_index_slot_index_status",
                schema: "kondix",
                table: "workout_sessions",
                columns: new[] { "assignment_id", "week_index", "slot_index", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_program_id",
                schema: "kondix",
                table: "workout_sessions",
                column: "program_id");

            migrationBuilder.CreateIndex(
                name: "ix_programs_is_published",
                schema: "kondix",
                table: "programs",
                column: "is_published");

            migrationBuilder.CreateIndex(
                name: "ix_program_assignments_program_id",
                schema: "kondix",
                table: "program_assignments",
                column: "program_id");

            migrationBuilder.CreateIndex(
                name: "ix_program_assignments_trainer_id",
                schema: "kondix",
                table: "program_assignments",
                column: "trainer_id");

            migrationBuilder.CreateIndex(
                name: "ix_program_slots_block_id",
                schema: "kondix",
                table: "program_slots",
                column: "block_id");

            migrationBuilder.CreateIndex(
                name: "ix_program_slots_day_id",
                schema: "kondix",
                table: "program_slots",
                column: "day_id");

            migrationBuilder.CreateIndex(
                name: "ix_program_slots_routine_id",
                schema: "kondix",
                table: "program_slots",
                column: "routine_id");

            migrationBuilder.CreateIndex(
                name: "ix_program_slots_week_id_day_index",
                schema: "kondix",
                table: "program_slots",
                columns: new[] { "week_id", "day_index" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_program_weeks_program_id_week_index",
                schema: "kondix",
                table: "program_weeks",
                columns: new[] { "program_id", "week_index" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_program_assignments_students_student_id",
                schema: "kondix",
                table: "program_assignments",
                column: "student_id",
                principalSchema: "kondix",
                principalTable: "students",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_program_assignments_trainers_trainer_id",
                schema: "kondix",
                table: "program_assignments",
                column: "trainer_id",
                principalSchema: "kondix",
                principalTable: "trainers",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_programs_trainers_trainer_id",
                schema: "kondix",
                table: "programs",
                column: "trainer_id",
                principalSchema: "kondix",
                principalTable: "trainers",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_workout_sessions_program_assignments_assignment_id",
                schema: "kondix",
                table: "workout_sessions",
                column: "assignment_id",
                principalSchema: "kondix",
                principalTable: "program_assignments",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_workout_sessions_programs_program_id",
                schema: "kondix",
                table: "workout_sessions",
                column: "program_id",
                principalSchema: "kondix",
                principalTable: "programs",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_program_assignments_students_student_id",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropForeignKey(
                name: "fk_program_assignments_trainers_trainer_id",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropForeignKey(
                name: "fk_programs_trainers_trainer_id",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropForeignKey(
                name: "fk_workout_sessions_program_assignments_assignment_id",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropForeignKey(
                name: "fk_workout_sessions_programs_program_id",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropTable(
                name: "program_slots",
                schema: "kondix");

            migrationBuilder.DropTable(
                name: "program_weeks",
                schema: "kondix");

            migrationBuilder.DropIndex(
                name: "ix_workout_sessions_assignment_id_week_index_slot_index_status",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropIndex(
                name: "ix_workout_sessions_program_id",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropIndex(
                name: "ix_programs_is_published",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropIndex(
                name: "ix_program_assignments_program_id",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropIndex(
                name: "ix_program_assignments_trainer_id",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropColumn(
                name: "assignment_id",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "program_id",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "recovers_planned_date",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "rpe",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "slot_index",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "status",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "updated_at",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "week_index",
                schema: "kondix",
                table: "workout_sessions");

            migrationBuilder.DropColumn(
                name: "days_per_week",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropColumn(
                name: "is_published",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropColumn(
                name: "level",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropColumn(
                name: "mode",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropColumn(
                name: "notes",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropColumn(
                name: "objective",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropColumn(
                name: "schedule_type",
                schema: "kondix",
                table: "programs");

            migrationBuilder.DropColumn(
                name: "trainer_id",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.DropColumn(
                name: "updated_at",
                schema: "kondix",
                table: "program_assignments");

            migrationBuilder.AddColumn<Guid>(
                name: "program_assignment_id",
                schema: "kondix",
                table: "workout_sessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "kondix",
                table: "programs",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(120)",
                oldMaxLength: 120);

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "created_at",
                schema: "kondix",
                table: "programs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()",
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<Guid>(
                name: "id",
                schema: "kondix",
                table: "programs",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()",
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<int>(
                name: "duration_weeks",
                schema: "kondix",
                table: "programs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                schema: "kondix",
                table: "programs",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AlterColumn<string>(
                name: "status",
                schema: "kondix",
                table: "program_assignments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Active",
                oldClrType: typeof(string),
                oldType: "character varying(16)",
                oldMaxLength: 16);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "start_date",
                schema: "kondix",
                table: "program_assignments",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "created_at",
                schema: "kondix",
                table: "program_assignments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()",
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<Guid>(
                name: "id",
                schema: "kondix",
                table: "program_assignments",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()",
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "completed_at",
                schema: "kondix",
                table: "program_assignments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "end_date",
                schema: "kondix",
                table: "program_assignments",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<string>(
                name: "fixed_schedule_json",
                schema: "kondix",
                table: "program_assignments",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "mode",
                schema: "kondix",
                table: "program_assignments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "rotation_index",
                schema: "kondix",
                table: "program_assignments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<List<int>>(
                name: "training_days",
                schema: "kondix",
                table: "program_assignments",
                type: "integer[]",
                nullable: false,
                defaultValueSql: "ARRAY[]::integer[]");

            migrationBuilder.CreateTable(
                name: "program_routines",
                schema: "kondix",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    program_id = table.Column<Guid>(type: "uuid", nullable: false),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_program_routines", x => x.id);
                    table.ForeignKey(
                        name: "fk_program_routines_programs_program_id",
                        column: x => x.program_id,
                        principalSchema: "kondix",
                        principalTable: "programs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_program_routines_routines_routine_id",
                        column: x => x.routine_id,
                        principalSchema: "kondix",
                        principalTable: "routines",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "program_week_overrides",
                schema: "kondix",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    program_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    week_index = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_program_week_overrides", x => x.id);
                    table.ForeignKey(
                        name: "fk_program_week_overrides_programs_program_id",
                        column: x => x.program_id,
                        principalSchema: "kondix",
                        principalTable: "programs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_program_assignment_id",
                schema: "kondix",
                table: "workout_sessions",
                column: "program_assignment_id");

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_student_id_program_assignment_id",
                schema: "kondix",
                table: "workout_sessions",
                columns: new[] { "student_id", "program_assignment_id" });

            migrationBuilder.CreateIndex(
                name: "ix_program_assignments_program_id_student_id",
                schema: "kondix",
                table: "program_assignments",
                columns: new[] { "program_id", "student_id" },
                unique: true,
                filter: "status = 'Active'");

            migrationBuilder.CreateIndex(
                name: "ix_program_assignments_student_id",
                schema: "kondix",
                table: "program_assignments",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "ix_program_routines_program_id_sort_order",
                schema: "kondix",
                table: "program_routines",
                columns: new[] { "program_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_program_routines_routine_id",
                schema: "kondix",
                table: "program_routines",
                column: "routine_id");

            migrationBuilder.CreateIndex(
                name: "ix_program_week_overrides_program_id_week_index",
                schema: "kondix",
                table: "program_week_overrides",
                columns: new[] { "program_id", "week_index" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_program_assignments_students_student_id",
                schema: "kondix",
                table: "program_assignments",
                column: "student_id",
                principalSchema: "kondix",
                principalTable: "students",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_programs_trainers_trainer_id",
                schema: "kondix",
                table: "programs",
                column: "trainer_id",
                principalSchema: "kondix",
                principalTable: "trainers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_workout_sessions_program_assignments_program_assignment_id",
                schema: "kondix",
                table: "workout_sessions",
                column: "program_assignment_id",
                principalSchema: "kondix",
                principalTable: "program_assignments",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
