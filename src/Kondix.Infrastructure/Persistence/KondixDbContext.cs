using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Infrastructure.Persistence;

public class KondixDbContext(DbContextOptions<KondixDbContext> options)
    : DbContext(options), IKondixDbContext
{
    public DbSet<Trainer> Trainers => Set<Trainer>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<TrainerStudent> TrainerStudents => Set<TrainerStudent>();
    public DbSet<StudentInvitation> StudentInvitations => Set<StudentInvitation>();
    public DbSet<Routine> Routines => Set<Routine>();
    public DbSet<Day> Days => Set<Day>();
    public DbSet<ExerciseBlock> ExerciseBlocks => Set<ExerciseBlock>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<ExerciseSet> ExerciseSets => Set<ExerciseSet>();
    public DbSet<Program> Programs => Set<Program>();
    public DbSet<ProgramWeek> ProgramWeeks => Set<ProgramWeek>();
    public DbSet<ProgramSlot> ProgramSlots => Set<ProgramSlot>();
    public DbSet<ProgramAssignment> ProgramAssignments => Set<ProgramAssignment>();
    public DbSet<WorkoutSession> WorkoutSessions => Set<WorkoutSession>();
    public DbSet<SetLog> SetLogs => Set<SetLog>();
    public DbSet<TrainerNote> TrainerNotes => Set<TrainerNote>();
    public DbSet<CatalogExercise> CatalogExercises => Set<CatalogExercise>();
    public DbSet<AssignmentTemplate> AssignmentTemplates => Set<AssignmentTemplate>();
    public DbSet<PersonalRecord> PersonalRecords => Set<PersonalRecord>();
    public DbSet<BodyMetric> BodyMetrics => Set<BodyMetric>();
    public DbSet<BodyMeasurement> BodyMeasurements => Set<BodyMeasurement>();
    public DbSet<ProgressPhoto> ProgressPhotos => Set<ProgressPhoto>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<ExerciseFeedback> ExerciseFeedback => Set<ExerciseFeedback>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("kondix");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(KondixDbContext).Assembly);
    }
}
