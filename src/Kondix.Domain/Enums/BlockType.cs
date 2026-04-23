namespace Kondix.Domain.Enums;

/// <summary>
/// The shape of a multi-exercise block inside a routine day.
/// A block with a single exercise is represented by `null` at every layer —
/// "Individual" is not an explicit type, it's the implicit absence of grouping.
/// </summary>
public enum BlockType
{
    Superset,
    Triset,
    Circuit
}
