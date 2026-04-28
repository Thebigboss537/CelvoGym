const PATTERN = [0, 2, 4, 1, 3, 5, 6] as const;

/**
 * Maps a list of routine-day IDs to weekday indices (0=Mon..6=Sun)
 * using the L-V spread pattern from the React prototype: Mon, Wed, Fri,
 * then Tue, Thu, Sat, Sun. Returns null for days beyond index 6.
 */
export function suggestWeekdayMapping(dayIds: readonly string[]): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  dayIds.forEach((id, i) => {
    result[id] = i < PATTERN.length ? PATTERN[i] : null;
  });
  return result;
}
