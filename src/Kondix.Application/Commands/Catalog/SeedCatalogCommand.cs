using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Catalog;

/// <summary>
/// Populates a trainer's catalog with a canonical set of common exercises.
/// Idempotent: a second call is a no-op (case-insensitive name match skips
/// anything already present). Media fields are intentionally empty — the
/// trainer fills in thumbnails/videos afterwards on the catalog screen.
/// </summary>
public sealed record SeedCatalogCommand(Guid TrainerId) : IRequest<int>;

public sealed class SeedCatalogHandler(IKondixDbContext db)
    : IRequestHandler<SeedCatalogCommand, int>
{
    // (Name, MuscleGroup) — ~50 staples covering Pecho/Espalda/Piernas/
    // Hombro/Brazos/Core/Glúteos/Cardio/Funcional/Movilidad. Keep the list
    // here (single source of truth in Spanish); the SQL mirror in setup/ is
    // documentation, not execution path.
    private static readonly (string Name, string Muscle)[] Canonical =
    [
        ("Press banca", "Pecho"),
        ("Press inclinado", "Pecho"),
        ("Aperturas con mancuernas", "Pecho"),
        ("Fondos en paralelas", "Pecho"),
        ("Sentadilla libre", "Piernas"),
        ("Sentadilla búlgara", "Piernas"),
        ("Prensa", "Piernas"),
        ("Extensiones de cuádriceps", "Piernas"),
        ("Curl femoral", "Piernas"),
        ("Peso muerto", "Espalda"),
        ("Peso muerto rumano", "Espalda"),
        ("Dominadas", "Espalda"),
        ("Jalón al pecho", "Espalda"),
        ("Remo con barra", "Espalda"),
        ("Remo con mancuerna", "Espalda"),
        ("Remo en polea baja", "Espalda"),
        ("Pull-over con mancuerna", "Espalda"),
        ("Press militar", "Hombro"),
        ("Press Arnold", "Hombro"),
        ("Elevaciones laterales", "Hombro"),
        ("Elevaciones frontales", "Hombro"),
        ("Pájaros / reverse fly", "Hombro"),
        ("Encogimientos", "Hombro"),
        ("Curl de bíceps con barra", "Brazos"),
        ("Curl martillo", "Brazos"),
        ("Curl predicador", "Brazos"),
        ("Extensiones de tríceps en polea", "Brazos"),
        ("Press francés", "Brazos"),
        ("Fondos entre bancos", "Brazos"),
        ("Plancha", "Core"),
        ("Plancha lateral", "Core"),
        ("Crunch", "Core"),
        ("Elevaciones de piernas colgado", "Core"),
        ("Rueda abdominal", "Core"),
        ("Pallof press", "Core"),
        ("Hip thrust", "Glúteos"),
        ("Sentadilla goblet", "Glúteos"),
        ("Patada de glúteo", "Glúteos"),
        ("Abducción en máquina", "Glúteos"),
        ("Caminadora", "Cardio"),
        ("Bicicleta estática", "Cardio"),
        ("Elíptica", "Cardio"),
        ("Remoergómetro", "Cardio"),
        ("Burpees", "Funcional"),
        ("Kettlebell swing", "Funcional"),
        ("Turkish get-up", "Funcional"),
        ("Battle ropes", "Funcional"),
        ("Movilidad de hombros", "Movilidad"),
        ("Movilidad de caderas", "Movilidad"),
        ("Estiramientos isquios", "Movilidad"),
    ];

    public async Task<int> Handle(SeedCatalogCommand request, CancellationToken cancellationToken)
    {
        var existing = await db.CatalogExercises
            .Where(c => c.TrainerId == request.TrainerId)
            .Select(c => c.Name.ToLower())
            .ToListAsync(cancellationToken);
        var skip = existing.ToHashSet();

        var inserted = 0;
        var now = DateTimeOffset.UtcNow;
        foreach (var (name, muscle) in Canonical)
        {
            if (skip.Contains(name.ToLowerInvariant())) continue;
            db.CatalogExercises.Add(new CatalogExercise
            {
                TrainerId = request.TrainerId,
                Name = name,
                MuscleGroup = muscle,
                IsActive = true,
                VideoSource = VideoSource.None,
                UpdatedAt = now,
            });
            inserted++;
        }
        if (inserted > 0)
            await db.SaveChangesAsync(cancellationToken);
        return inserted;
    }
}
