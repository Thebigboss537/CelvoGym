using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Kondix.Infrastructure.Persistence;

public class KondixDbContext(DbContextOptions<KondixDbContext> options)
    : DbContext(options), IKondixDbContext
{
    // Shared root ensures all InMemory context instances within a test run
    // access the same in-memory store, regardless of the per-scope name generated
    // by the WebApplicationFactory test harness.
    private static readonly InMemoryDatabaseRoot SharedTestRoot = new();
    private const string SharedTestDatabaseName = "KondixIntegrationTest";

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // If InMemory is configured (test environment only), normalise to a single shared
        // database so data seeded in one scope is visible to the HTTP handler scope.
        // We detect InMemory by extension type name to avoid a compile-time dependency
        // on the internal EF1001 InMemoryOptionsExtension type.
        var hasInMemory = optionsBuilder.Options.Extensions
            .Any(e => e.GetType().Name == "InMemoryOptionsExtension");
        if (hasInMemory)
        {
            optionsBuilder.UseInMemoryDatabase(SharedTestDatabaseName, SharedTestRoot);
        }
    }


    public DbSet<Trainer> Trainers => Set<Trainer>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<TrainerStudent> TrainerStudents => Set<TrainerStudent>();
    public DbSet<StudentInvitation> StudentInvitations => Set<StudentInvitation>();
    public DbSet<Routine> Routines => Set<Routine>();
    public DbSet<Day> Days => Set<Day>();
    public DbSet<ExerciseGroup> ExerciseGroups => Set<ExerciseGroup>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<ExerciseSet> ExerciseSets => Set<ExerciseSet>();
    public DbSet<Program> Programs => Set<Program>();
    public DbSet<ProgramRoutine> ProgramRoutines => Set<ProgramRoutine>();
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("kondix");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(KondixDbContext).Assembly);
    }
}
