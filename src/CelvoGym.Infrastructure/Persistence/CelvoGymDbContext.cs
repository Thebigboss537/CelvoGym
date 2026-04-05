using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Infrastructure.Persistence;

public class CelvoGymDbContext(DbContextOptions<CelvoGymDbContext> options)
    : DbContext(options), ICelvoGymDbContext
{
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
    public DbSet<RoutineAssignment> RoutineAssignments => Set<RoutineAssignment>();
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
        modelBuilder.HasDefaultSchema("gym");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CelvoGymDbContext).Assembly);
    }
}
