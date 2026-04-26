using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kondix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameGroupsToBlocks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder m)
        {
            // In-place renames only — DO NOT drop+recreate; would lose every
            // existing routine's block/exercise data. EF's scaffold defaults to
            // drop+create when a type name changes in the model; replaced here
            // with explicit ALTER TABLE statements.

            // Rename tables/columns/indexes/constraints
            m.Sql("ALTER TABLE kondix.exercise_groups RENAME TO exercise_blocks;");
            m.Sql("ALTER TABLE kondix.exercise_blocks RENAME COLUMN group_type TO block_type;");
            m.Sql("ALTER TABLE kondix.exercises RENAME COLUMN group_id TO block_id;");

            m.Sql("ALTER INDEX kondix.pk_exercise_groups RENAME TO pk_exercise_blocks;");
            m.Sql("ALTER INDEX kondix.ix_exercise_groups_day_id RENAME TO ix_exercise_blocks_day_id;");
            m.Sql("ALTER INDEX kondix.ix_exercises_group_id RENAME TO ix_exercises_block_id;");

            m.Sql("ALTER TABLE kondix.exercises DROP CONSTRAINT fk_exercises_exercise_groups_group_id;");
            m.Sql(@"ALTER TABLE kondix.exercises
                ADD CONSTRAINT fk_exercises_exercise_blocks_block_id
                FOREIGN KEY (block_id) REFERENCES kondix.exercise_blocks(id) ON DELETE CASCADE;");

            m.Sql("ALTER TABLE kondix.exercise_blocks DROP CONSTRAINT fk_exercise_groups_days_day_id;");
            m.Sql(@"ALTER TABLE kondix.exercise_blocks
                ADD CONSTRAINT fk_exercise_blocks_days_day_id
                FOREIGN KEY (day_id) REFERENCES kondix.days(id) ON DELETE CASCADE;");

            // Drop the NOT NULL + default on block_type so null represents "no
            // grouping" (implicit Individual).
            m.Sql(@"ALTER TABLE kondix.exercise_blocks
                ALTER COLUMN block_type DROP DEFAULT,
                ALTER COLUMN block_type DROP NOT NULL;");

            // Collapse every 'Single' row to NULL — the enum no longer has
            // that member, and every single-exercise block is now implicit.
            m.Sql("UPDATE kondix.exercise_blocks SET block_type = NULL WHERE block_type = 'Single';");

            // Defensive: any block that ended up with only 1 exercise (even if
            // its type was Superset/etc from legacy data) also becomes implicit
            // individual — the new wizard UX will hide the type selector for
            // these, so the DB value should match.
            m.Sql(@"UPDATE kondix.exercise_blocks b
                SET block_type = NULL
                WHERE block_type IS NOT NULL
                  AND (SELECT COUNT(*) FROM kondix.exercises e WHERE e.block_id = b.id) <= 1;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder m)
        {
            // Restore 'Single' for roundtrip before re-adding NOT NULL
            m.Sql("UPDATE kondix.exercise_blocks SET block_type = 'Single' WHERE block_type IS NULL;");
            m.Sql(@"ALTER TABLE kondix.exercise_blocks
                ALTER COLUMN block_type SET DEFAULT 'Single',
                ALTER COLUMN block_type SET NOT NULL;");

            m.Sql("ALTER TABLE kondix.exercise_blocks DROP CONSTRAINT fk_exercise_blocks_days_day_id;");
            m.Sql(@"ALTER TABLE kondix.exercise_blocks
                ADD CONSTRAINT fk_exercise_groups_days_day_id
                FOREIGN KEY (day_id) REFERENCES kondix.days(id) ON DELETE CASCADE;");

            m.Sql("ALTER TABLE kondix.exercises DROP CONSTRAINT fk_exercises_exercise_blocks_block_id;");
            m.Sql(@"ALTER TABLE kondix.exercises
                ADD CONSTRAINT fk_exercises_exercise_groups_group_id
                FOREIGN KEY (block_id) REFERENCES kondix.exercise_blocks(id) ON DELETE CASCADE;");

            m.Sql("ALTER INDEX kondix.ix_exercises_block_id RENAME TO ix_exercises_group_id;");
            m.Sql("ALTER INDEX kondix.ix_exercise_blocks_day_id RENAME TO ix_exercise_groups_day_id;");
            m.Sql("ALTER INDEX kondix.pk_exercise_blocks RENAME TO pk_exercise_groups;");

            m.Sql("ALTER TABLE kondix.exercises RENAME COLUMN block_id TO group_id;");
            m.Sql("ALTER TABLE kondix.exercise_blocks RENAME COLUMN block_type TO group_type;");
            m.Sql("ALTER TABLE kondix.exercise_blocks RENAME TO exercise_groups;");
        }
    }
}
