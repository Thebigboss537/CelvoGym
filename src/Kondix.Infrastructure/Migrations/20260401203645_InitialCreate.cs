using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kondix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "gym");

            migrationBuilder.CreateTable(
                name: "comments",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_id = table.Column<Guid>(type: "uuid", nullable: false),
                    exercise_id = table.Column<Guid>(type: "uuid", nullable: true),
                    author_id = table.Column<Guid>(type: "uuid", nullable: false),
                    author_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_comments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "trainers",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    celvo_guard_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    bio = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    avatar_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_approved = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    approved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_trainers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "routines",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    trainer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_routines", x => x.id);
                    table.ForeignKey(
                        name: "fk_routines_trainers_trainer_id",
                        column: x => x.trainer_id,
                        principalSchema: "gym",
                        principalTable: "trainers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_invitations",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    trainer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    token_hash = table.Column<string>(type: "character varying(88)", maxLength: 88, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    accepted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    accepted_by_student_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_student_invitations", x => x.id);
                    table.ForeignKey(
                        name: "fk_student_invitations_trainers_trainer_id",
                        column: x => x.trainer_id,
                        principalSchema: "gym",
                        principalTable: "trainers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "students",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    celvo_guard_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    active_trainer_id = table.Column<Guid>(type: "uuid", nullable: true),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    avatar_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_students", x => x.id);
                    table.ForeignKey(
                        name: "fk_students_trainers_active_trainer_id",
                        column: x => x.active_trainer_id,
                        principalSchema: "gym",
                        principalTable: "trainers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "days",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_days", x => x.id);
                    table.ForeignKey(
                        name: "fk_days_routines_routine_id",
                        column: x => x.routine_id,
                        principalSchema: "gym",
                        principalTable: "routines",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "routine_assignments",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    deactivated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_routine_assignments", x => x.id);
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

            migrationBuilder.CreateTable(
                name: "trainer_students",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    trainer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_trainer_students", x => x.id);
                    table.ForeignKey(
                        name: "fk_trainer_students_students_student_id",
                        column: x => x.student_id,
                        principalSchema: "gym",
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_trainer_students_trainers_trainer_id",
                        column: x => x.trainer_id,
                        principalSchema: "gym",
                        principalTable: "trainers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "exercise_groups",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    day_id = table.Column<Guid>(type: "uuid", nullable: false),
                    group_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Single"),
                    rest_seconds = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_exercise_groups", x => x.id);
                    table.ForeignKey(
                        name: "fk_exercise_groups_days_day_id",
                        column: x => x.day_id,
                        principalSchema: "gym",
                        principalTable: "days",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "exercises",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    group_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    video_source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "None"),
                    video_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    tempo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_exercises", x => x.id);
                    table.ForeignKey(
                        name: "fk_exercises_exercise_groups_group_id",
                        column: x => x.group_id,
                        principalSchema: "gym",
                        principalTable: "exercise_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "exercise_sets",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    exercise_id = table.Column<Guid>(type: "uuid", nullable: false),
                    set_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Effective"),
                    target_reps = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    target_weight = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    target_rpe = table.Column<int>(type: "integer", nullable: true),
                    rest_seconds = table.Column<int>(type: "integer", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_exercise_sets", x => x.id);
                    table.ForeignKey(
                        name: "fk_exercise_sets_exercises_exercise_id",
                        column: x => x.exercise_id,
                        principalSchema: "gym",
                        principalTable: "exercises",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "set_logs",
                schema: "gym",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    set_id = table.Column<Guid>(type: "uuid", nullable: false),
                    routine_id = table.Column<Guid>(type: "uuid", nullable: false),
                    completed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    actual_weight = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    actual_reps = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    actual_rpe = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_set_logs", x => x.id);
                    table.ForeignKey(
                        name: "fk_set_logs_exercise_sets_set_id",
                        column: x => x.set_id,
                        principalSchema: "gym",
                        principalTable: "exercise_sets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_set_logs_students_student_id",
                        column: x => x.student_id,
                        principalSchema: "gym",
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_comments_routine_id_day_id",
                schema: "gym",
                table: "comments",
                columns: new[] { "routine_id", "day_id" });

            migrationBuilder.CreateIndex(
                name: "ix_days_routine_id",
                schema: "gym",
                table: "days",
                column: "routine_id");

            migrationBuilder.CreateIndex(
                name: "ix_exercise_groups_day_id",
                schema: "gym",
                table: "exercise_groups",
                column: "day_id");

            migrationBuilder.CreateIndex(
                name: "ix_exercise_sets_exercise_id",
                schema: "gym",
                table: "exercise_sets",
                column: "exercise_id");

            migrationBuilder.CreateIndex(
                name: "ix_exercises_group_id",
                schema: "gym",
                table: "exercises",
                column: "group_id");

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

            migrationBuilder.CreateIndex(
                name: "ix_routines_trainer_id",
                schema: "gym",
                table: "routines",
                column: "trainer_id");

            migrationBuilder.CreateIndex(
                name: "ix_set_logs_set_id",
                schema: "gym",
                table: "set_logs",
                column: "set_id");

            migrationBuilder.CreateIndex(
                name: "ix_set_logs_student_id_routine_id",
                schema: "gym",
                table: "set_logs",
                columns: new[] { "student_id", "routine_id" });

            migrationBuilder.CreateIndex(
                name: "ix_set_logs_student_id_set_id",
                schema: "gym",
                table: "set_logs",
                columns: new[] { "student_id", "set_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_student_invitations_token_hash",
                schema: "gym",
                table: "student_invitations",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_student_invitations_trainer_id",
                schema: "gym",
                table: "student_invitations",
                column: "trainer_id");

            migrationBuilder.CreateIndex(
                name: "ix_students_active_trainer_id",
                schema: "gym",
                table: "students",
                column: "active_trainer_id");

            migrationBuilder.CreateIndex(
                name: "ix_students_celvo_guard_user_id",
                schema: "gym",
                table: "students",
                column: "celvo_guard_user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_trainer_students_student_id",
                schema: "gym",
                table: "trainer_students",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "ix_trainer_students_trainer_id_student_id",
                schema: "gym",
                table: "trainer_students",
                columns: new[] { "trainer_id", "student_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_trainers_celvo_guard_user_id",
                schema: "gym",
                table: "trainers",
                column: "celvo_guard_user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_trainers_tenant_id",
                schema: "gym",
                table: "trainers",
                column: "tenant_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "comments",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "routine_assignments",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "set_logs",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "student_invitations",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "trainer_students",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "exercise_sets",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "students",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "exercises",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "exercise_groups",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "days",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "routines",
                schema: "gym");

            migrationBuilder.DropTable(
                name: "trainers",
                schema: "gym");
        }
    }
}
