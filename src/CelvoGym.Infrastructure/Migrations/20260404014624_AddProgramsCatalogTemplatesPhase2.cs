using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CelvoGym.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProgramsCatalogTemplatesPhase2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "end_date",
                schema: "gym",
                table: "routine_assignments",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "program_id",
                schema: "gym",
                table: "routine_assignments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "start_date",
                schema: "gym",
                table: "routine_assignments",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "catalog_exercise_id",
                schema: "gym",
                table: "exercises",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "catalog_exercises",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    trainer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    muscle_group = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    video_source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "None"),
                    video_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_catalog_exercises", x => x.id);
                    table.ForeignKey(
                        name: "fk_catalog_exercises_trainers_trainer_id",
                        column: x => x.trainer_id,
                        principalSchema: "gym",
                        principalTable: "trainers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "programs",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    trainer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    duration_weeks = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_programs", x => x.id);
                    table.ForeignKey(
                        name: "fk_programs_trainers_trainer_id",
                        column: x => x.trainer_id,
                        principalSchema: "gym",
                        principalTable: "trainers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "assignment_templates",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    trainer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    program_id = table.Column<Guid>(type: "uuid", nullable: true),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: true),
                    scheduled_days = table.Column<List<int>>(type: "integer[]", nullable: false, defaultValueSql: "ARRAY[]::integer[]"),
                    duration_weeks = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_assignment_templates", x => x.id);
                    table.ForeignKey(
                        name: "fk_assignment_templates_programs_program_id",
                        column: x => x.program_id,
                        principalSchema: "gym",
                        principalTable: "programs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_assignment_templates_routines_routine_id",
                        column: x => x.routine_id,
                        principalSchema: "gym",
                        principalTable: "routines",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_assignment_templates_trainers_trainer_id",
                        column: x => x.trainer_id,
                        principalSchema: "gym",
                        principalTable: "trainers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "program_routines",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    program_id = table.Column<Guid>(type: "uuid", nullable: false),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: false),
                    label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_program_routines", x => x.id);
                    table.ForeignKey(
                        name: "fk_program_routines_programs_program_id",
                        column: x => x.program_id,
                        principalSchema: "gym",
                        principalTable: "programs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_program_routines_routines_routine_id",
                        column: x => x.routine_id,
                        principalSchema: "gym",
                        principalTable: "routines",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_routine_assignments_program_id",
                schema: "gym",
                table: "routine_assignments",
                column: "program_id");

            migrationBuilder.CreateIndex(
                name: "ix_exercises_catalog_exercise_id",
                schema: "gym",
                table: "exercises",
                column: "catalog_exercise_id");

            migrationBuilder.CreateIndex(
                name: "ix_assignment_templates_program_id",
                schema: "gym",
                table: "assignment_templates",
                column: "program_id");

            migrationBuilder.CreateIndex(
                name: "ix_assignment_templates_routine_id",
                schema: "gym",
                table: "assignment_templates",
                column: "routine_id");

            migrationBuilder.CreateIndex(
                name: "ix_assignment_templates_trainer_id",
                schema: "gym",
                table: "assignment_templates",
                column: "trainer_id");

            migrationBuilder.CreateIndex(
                name: "ix_catalog_exercises_trainer_id_name",
                schema: "gym",
                table: "catalog_exercises",
                columns: new[] { "trainer_id", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_program_routines_program_id_sort_order",
                schema: "gym",
                table: "program_routines",
                columns: new[] { "program_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_program_routines_routine_id",
                schema: "gym",
                table: "program_routines",
                column: "routine_id");

            migrationBuilder.CreateIndex(
                name: "ix_programs_trainer_id",
                schema: "gym",
                table: "programs",
                column: "trainer_id");

            migrationBuilder.AddForeignKey(
                name: "fk_exercises_catalog_exercises_catalog_exercise_id",
                schema: "gym",
                table: "exercises",
                column: "catalog_exercise_id",
                principalSchema: "gym",
                principalTable: "catalog_exercises",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_routine_assignments_programs_program_id",
                schema: "gym",
                table: "routine_assignments",
                column: "program_id",
                principalSchema: "gym",
                principalTable: "programs",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_exercises_catalog_exercises_catalog_exercise_id",
                schema: "gym",
                table: "exercises");

            migrationBuilder.DropForeignKey(
                name: "fk_routine_assignments_programs_program_id",
                schema: "gym",
                table: "routine_assignments");

            migrationBuilder.DropTable(
                name: "assignment_templates",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "catalog_exercises",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "program_routines",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "programs",
                schema: "gym");

            migrationBuilder.DropIndex(
                name: "ix_routine_assignments_program_id",
                schema: "gym",
                table: "routine_assignments");

            migrationBuilder.DropIndex(
                name: "ix_exercises_catalog_exercise_id",
                schema: "gym",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "end_date",
                schema: "gym",
                table: "routine_assignments");

            migrationBuilder.DropColumn(
                name: "program_id",
                schema: "gym",
                table: "routine_assignments");

            migrationBuilder.DropColumn(
                name: "start_date",
                schema: "gym",
                table: "routine_assignments");

            migrationBuilder.DropColumn(
                name: "catalog_exercise_id",
                schema: "gym",
                table: "exercises");
        }
    }
}
