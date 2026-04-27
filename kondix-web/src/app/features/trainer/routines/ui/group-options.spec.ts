import { computeGroupOptions } from './group-options';
import type { WizardBlock, WizardExercise, WizardSet } from './types';

const newSet = (): WizardSet => ({ setType: 'Effective', targetReps: '', targetWeight: '', targetRpe: null, restSeconds: null });
const newEx = (name = ''): WizardExercise => ({ name, notes: '', tempo: '', catalogExerciseId: null, catalogImageUrl: null, catalogVideoUrl: null, sets: [newSet()] });
const single = (name: string): WizardBlock => ({ blockType: null, restSeconds: 90, exercises: [newEx(name)] });
const cluster = (type: 'Superset' | 'Triset' | 'Circuit', count: number): WizardBlock => ({
  blockType: type, restSeconds: 60,
  exercises: Array.from({ length: count }, (_, i) => newEx(`ex${i}`)),
});

describe('computeGroupOptions', () => {

  it('returns only Duplicate/Eliminate-equivalent (empty) when alone in day', () => {
    const blocks = [single('A')];
    expect(computeGroupOptions(blocks, 0)).toEqual([]);
  });

  it('first block with single neighbor below: only Superset down', () => {
    const blocks = [single('A'), single('B')];
    expect(computeGroupOptions(blocks, 0)).toEqual([
      { kind: 'group', type: 'Superset', direction: 'down', count: 1 },
    ]);
  });

  it('middle block with single neighbors above and below: Superset both ways', () => {
    const blocks = [single('A'), single('B'), single('C')];
    expect(computeGroupOptions(blocks, 1)).toEqual([
      { kind: 'group', type: 'Superset', direction: 'up', count: 1 },
      { kind: 'group', type: 'Superset', direction: 'down', count: 1 },
    ]);
  });

  it('block with 3 single neighbors below: offers Superset/Triset/Circuit down', () => {
    const blocks = [single('A'), single('B'), single('C'), single('D')];
    expect(computeGroupOptions(blocks, 0)).toEqual([
      { kind: 'group', type: 'Superset', direction: 'down', count: 1 },
      { kind: 'group', type: 'Triset', direction: 'down', count: 2 },
      { kind: 'group', type: 'Circuit', direction: 'down', count: 3 },
    ]);
  });

  it('chain broken by a cluster: stops at the cluster, does not skip past', () => {
    const blocks = [single('A'), single('B'), cluster('Superset', 2), single('D')];
    // From block 0 (A): only B is reachable (B then a Superset stops the chain)
    expect(computeGroupOptions(blocks, 0)).toEqual([
      { kind: 'group', type: 'Superset', direction: 'down', count: 1 },
    ]);
  });

  it('block inside a cluster: only Ungroup', () => {
    const blocks = [cluster('Superset', 2), single('C')];
    // Inside-cluster representation: the consumer (day-panel) calls
    // computeGroupOptions for a NON-cluster block. Inside-cluster rendering
    // emits 'ungroup' directly without consulting this helper.
    // So this test ensures: even if called for a cluster block, we return
    // [{ kind: 'ungroup' }] as a sentinel.
    expect(computeGroupOptions(blocks, 0)).toEqual([{ kind: 'ungroup' }]);
  });

  it('last block with single neighbor above: only Superset up', () => {
    const blocks = [single('A'), single('B')];
    expect(computeGroupOptions(blocks, 1)).toEqual([
      { kind: 'group', type: 'Superset', direction: 'up', count: 1 },
    ]);
  });

});
