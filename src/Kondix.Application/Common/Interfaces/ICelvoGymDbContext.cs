using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Kondix.Application.Common.Interfaces;

public interface IKondixDbContext
{
    DbSet<Trainer> Trainers { get; }
    DbSet<Student> Students { get; }
    DbSet<TrainerStudent> TrainerStudents { get; }
    DbSet<StudentInvitation> StudentInvitations { get; }
    DbSet<Routine> Routines { get; }
    DbSet<Day> Days { get; }
    DbSet<ExerciseGroup> ExerciseGroups { get; }
    DbSet<Exercise> Exercises { get; }
    DbSet<ExerciseSet> ExerciseSets { get; }
    DbSet<Program> Programs { get; }
    DbSet<ProgramRoutine> ProgramRoutines { get; }
    DbSet<ProgramAssignment> ProgramAssignments { get; }
    DbSet<WorkoutSession> WorkoutSessions { get; }
    DbSet<SetLog> SetLogs { get; }
    DbSet<TrainerNote> TrainerNotes { get; }
    DbSet<CatalogExercise> CatalogExercises { get; }
    DbSet<AssignmentTemplate> AssignmentTemplates { get; }
    DbSet<PersonalRecord> PersonalRecords { get; }
    DbSet<BodyMetric> BodyMetrics { get; }
    DbSet<BodyMeasurement> BodyMeasurements { get; }
    DbSet<ProgressPhoto> ProgressPhotos { get; }
    DbSet<Comment> Comments { get; }

    DatabaseFacade Database { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
