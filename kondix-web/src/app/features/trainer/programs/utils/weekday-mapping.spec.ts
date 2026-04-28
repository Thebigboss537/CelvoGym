import { suggestWeekdayMapping } from './weekday-mapping';

describe('suggestWeekdayMapping', () => {
  it('returns Mon/Wed/Fri for 3 days', () => {
    const result = suggestWeekdayMapping(['a', 'b', 'c']);
    expect(result).toEqual({ a: 0, b: 2, c: 4 });
  });

  it('extends to Tue/Thu for 5 days', () => {
    const result = suggestWeekdayMapping(['a', 'b', 'c', 'd', 'e']);
    expect(result).toEqual({ a: 0, b: 2, c: 4, d: 1, e: 3 });
  });

  it('caps at 7 days', () => {
    const result = suggestWeekdayMapping(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    // Pattern is [0, 2, 4, 1, 3, 5, 6]
    expect(
      Object.values(result)
        .sort((x, y) => ((x as number) ?? 999) - ((y as number) ?? 999))
    ).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('returns null for days beyond index 6', () => {
    const result = suggestWeekdayMapping(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(result['h']).toBeNull();
  });
});
