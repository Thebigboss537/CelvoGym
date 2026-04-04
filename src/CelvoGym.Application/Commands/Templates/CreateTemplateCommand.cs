using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Templates;

public sealed record CreateTemplateCommand(
    Guid TrainerId,
    string Name,
    Guid? ProgramId,
    Guid? RoutineId,
    List<int> ScheduledDays,
    int? DurationWeeks) : IRequest<AssignmentTemplateDto>;

public sealed class CreateTemplateHandler(ICelvoGymDbContext db)
    : IRequestHandler<CreateTemplateCommand, AssignmentTemplateDto>
{
    public async Task<AssignmentTemplateDto> Handle(CreateTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = new AssignmentTemplate
        {
            TrainerId = request.TrainerId,
            Name = request.Name,
            ProgramId = request.ProgramId,
            RoutineId = request.RoutineId,
            ScheduledDays = request.ScheduledDays,
            DurationWeeks = request.DurationWeeks
        };

        db.AssignmentTemplates.Add(template);
        await db.SaveChangesAsync(cancellationToken);

        // Fetch names
        string? programName = null, routineName = null;
        if (request.ProgramId.HasValue)
            programName = await db.Programs.Where(p => p.Id == request.ProgramId).Select(p => p.Name).FirstOrDefaultAsync(cancellationToken);
        if (request.RoutineId.HasValue)
            routineName = await db.Routines.Where(r => r.Id == request.RoutineId).Select(r => r.Name).FirstOrDefaultAsync(cancellationToken);

        return new AssignmentTemplateDto(template.Id, template.Name,
            template.ProgramId, programName, template.RoutineId, routineName,
            template.ScheduledDays, template.DurationWeeks);
    }
}
