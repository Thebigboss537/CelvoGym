using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace CelvoGym.Application.Common.Interfaces;

public interface ICelvoGymDbContext
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
    DbSet<RoutineAssignment> RoutineAssignments { get; }
    DbSet<SetLog> SetLogs { get; }
    DbSet<Comment> Comments { get; }

    DatabaseFacade Database { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
