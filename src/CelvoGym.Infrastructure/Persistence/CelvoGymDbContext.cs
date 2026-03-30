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
    public DbSet<RoutineAssignment> RoutineAssignments => Set<RoutineAssignment>();
    public DbSet<SetLog> SetLogs => Set<SetLog>();
    public DbSet<Comment> Comments => Set<Comment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("gym");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CelvoGymDbContext).Assembly);
    }
}
