using CelvoGym.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Templates;

public sealed record DeleteTemplateCommand(
    Guid TemplateId,
    Guid TrainerId) : IRequest<Unit>;

public sealed class DeleteTemplateHandler(ICelvoGymDbContext db)
    : IRequestHandler<DeleteTemplateCommand, Unit>
{
    public async Task<Unit> Handle(DeleteTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await db.AssignmentTemplates
            .FirstOrDefaultAsync(at => at.Id == request.TemplateId
                && at.TrainerId == request.TrainerId, cancellationToken)
            ?? throw new InvalidOperationException("Template not found");

        db.AssignmentTemplates.Remove(template);
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
