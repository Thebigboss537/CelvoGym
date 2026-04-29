using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Catalog;

/// <summary>
/// Populates a trainer's catalog with a canonical set of common exercises.
/// Each canonical entry has a stable thumbnail mirrored to MinIO from the
/// public-domain Free-Exercise-DB dataset (https://github.com/yuhonas/free-exercise-db).
/// On second/third call, missing canonical entries are inserted AND existing
/// rows still missing an ImageUrl get backfilled with the canonical image —
/// trainer customisations (custom Name/Image/Video) are never overwritten.
/// </summary>
public sealed record SeedCatalogCommand(Guid TrainerId) : IRequest<SeedCatalogResult>;

public sealed record SeedCatalogResult(int Inserted, int ImagesBackfilled);

public sealed class SeedCatalogHandler(IKondixDbContext db)
    : IRequestHandler<SeedCatalogCommand, SeedCatalogResult>
{
    private const string CdnPrefix = "https://storage.celvo.dev/kondix-catalog-images";

    // (Name, Muscle, ImageSlug?) — ImageSlug is the bucket key minus the .jpg extension.
    // null ImageSlug means we don't have a canonical image (Burpees has no match in the
    // source dataset; trainers can upload their own).
    private static readonly (string Name, string Muscle, string? ImageSlug)[] Canonical =
    [
        ("Press banca", "Pecho", "press-banca"),
        ("Press inclinado", "Pecho", "press-inclinado"),
        ("Aperturas con mancuernas", "Pecho", "aperturas-mancuernas"),
        ("Fondos en paralelas", "Pecho", "fondos-paralelas"),
        ("Sentadilla libre", "Piernas", "sentadilla-libre"),
        ("Sentadilla búlgara", "Piernas", "sentadilla-bulgara"),
        ("Prensa", "Piernas", "prensa"),
        ("Extensiones de cuádriceps", "Piernas", "extensiones-cuadriceps"),
        ("Curl femoral", "Piernas", "curl-femoral"),
        ("Peso muerto", "Espalda", "peso-muerto"),
        ("Peso muerto rumano", "Espalda", "peso-muerto-rumano"),
        ("Dominadas", "Espalda", "dominadas"),
        ("Jalón al pecho", "Espalda", "jalon-al-pecho"),
        ("Remo con barra", "Espalda", "remo-con-barra"),
        ("Remo con mancuerna", "Espalda", "remo-con-mancuerna"),
        ("Remo en polea baja", "Espalda", "remo-en-polea-baja"),
        ("Pull-over con mancuerna", "Espalda", "pullover-mancuerna"),
        ("Press militar", "Hombro", "press-militar"),
        ("Press Arnold", "Hombro", "press-arnold"),
        ("Elevaciones laterales", "Hombro", "elevaciones-laterales"),
        ("Elevaciones frontales", "Hombro", "elevaciones-frontales"),
        ("Pájaros / reverse fly", "Hombro", "pajaros-reverse-fly"),
        ("Encogimientos", "Hombro", "encogimientos"),
        ("Curl de bíceps con barra", "Brazos", "curl-biceps-barra"),
        ("Curl martillo", "Brazos", "curl-martillo"),
        ("Curl predicador", "Brazos", "curl-predicador"),
        ("Extensiones de tríceps en polea", "Brazos", "extensiones-triceps-polea"),
        ("Press francés", "Brazos", "press-frances"),
        ("Fondos entre bancos", "Brazos", "fondos-entre-bancos"),
        ("Plancha", "Core", "plancha"),
        ("Plancha lateral", "Core", "plancha-lateral"),
        ("Crunch", "Core", "crunch"),
        ("Elevaciones de piernas colgado", "Core", "elevaciones-piernas-colgado"),
        ("Rueda abdominal", "Core", "rueda-abdominal"),
        ("Pallof press", "Core", "pallof-press"),
        ("Hip thrust", "Glúteos", "hip-thrust"),
        ("Sentadilla goblet", "Glúteos", "sentadilla-goblet"),
        ("Patada de glúteo", "Glúteos", "patada-gluteo"),
        ("Abducción en máquina", "Glúteos", "abduccion-en-maquina"),
        ("Caminadora", "Cardio", "caminadora"),
        ("Bicicleta estática", "Cardio", "bicicleta-estatica"),
        ("Elíptica", "Cardio", "eliptica"),
        ("Remoergómetro", "Cardio", "remoergometro"),
        ("Burpees", "Funcional", null),
        ("Kettlebell swing", "Funcional", "kettlebell-swing"),
        ("Turkish get-up", "Funcional", "turkish-getup"),
        ("Battle ropes", "Funcional", "battle-ropes"),
        ("Movilidad de hombros", "Movilidad", "movilidad-hombros"),
        ("Movilidad de caderas", "Movilidad", "movilidad-caderas"),
        ("Estiramientos isquios", "Movilidad", "estiramientos-isquios"),
    ];

    private static string? ImageUrlFor(string? slug) =>
        slug is null ? null : $"{CdnPrefix}/{slug}.jpg";

    public async Task<SeedCatalogResult> Handle(SeedCatalogCommand request, CancellationToken cancellationToken)
    {
        var existing = await db.CatalogExercises
            .Where(c => c.TrainerId == request.TrainerId)
            .ToListAsync(cancellationToken);
        var byName = existing.ToDictionary(c => c.Name.ToLowerInvariant(), c => c);

        var inserted = 0;
        var backfilled = 0;
        var now = DateTimeOffset.UtcNow;

        foreach (var (name, muscle, slug) in Canonical)
        {
            var imageUrl = ImageUrlFor(slug);
            if (byName.TryGetValue(name.ToLowerInvariant(), out var current))
            {
                // Backfill image only when the trainer hasn't set one. Don't touch
                // muscle group either — they may have re-categorised their copy.
                if (current.ImageUrl is null && imageUrl is not null)
                {
                    current.ImageUrl = imageUrl;
                    current.UpdatedAt = now;
                    backfilled++;
                }
                continue;
            }

            db.CatalogExercises.Add(new CatalogExercise
            {
                TrainerId = request.TrainerId,
                Name = name,
                MuscleGroup = muscle,
                IsActive = true,
                VideoSource = VideoSource.None,
                ImageUrl = imageUrl,
                UpdatedAt = now,
            });
            inserted++;
        }
        if (inserted > 0 || backfilled > 0)
            await db.SaveChangesAsync(cancellationToken);
        return new SeedCatalogResult(inserted, backfilled);
    }
}
