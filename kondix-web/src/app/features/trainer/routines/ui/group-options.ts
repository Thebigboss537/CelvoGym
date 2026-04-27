import type { WizardBlock, GroupOption, BlockType } from './types';

/**
 * Compute the contextual menu options for a block at index `blockIdx`.
 *
 * Rules:
 * - If the block is itself a cluster (blockType !== null), the only option is
 *   { kind: 'ungroup' } as a sentinel; the consumer handles the menu rendering.
 * - Otherwise we walk neighbors in each direction, counting unbroken Single
 *   blocks (blockType === null). The chain stops at the first non-Single
 *   block or the array boundary.
 * - For each direction with N >= 1 chained singles, we offer:
 *     N == 1     → Superset
 *     N == 2     → Triset
 *     N >= 3     → Circuit (count is exactly the chain length, capped where needed)
 *   And include all smaller options too (so Superset is always offered when
 *   there's at least 1 neighbor; Triset when at least 2; etc.).
 */
export function computeGroupOptions(blocks: WizardBlock[], blockIdx: number): GroupOption[] {
  const block = blocks[blockIdx];
  if (!block) return [];

  // Inside-cluster: single sentinel.
  if (block.blockType !== null) {
    return [{ kind: 'ungroup' }];
  }

  // Walk up: count unbroken Single blocks above.
  let upCount = 0;
  for (let i = blockIdx - 1; i >= 0; i--) {
    if (blocks[i].blockType === null) upCount++;
    else break;
  }

  // Walk down: count unbroken Single blocks below.
  let downCount = 0;
  for (let i = blockIdx + 1; i < blocks.length; i++) {
    if (blocks[i].blockType === null) downCount++;
    else break;
  }

  const options: GroupOption[] = [];
  appendDirection(options, 'up', upCount);
  appendDirection(options, 'down', downCount);
  return options;
}

function appendDirection(out: GroupOption[], direction: 'up' | 'down', chainLen: number) {
  if (chainLen >= 1) out.push({ kind: 'group', type: 'Superset', direction, count: 1 });
  if (chainLen >= 2) out.push({ kind: 'group', type: 'Triset',   direction, count: 2 });
  if (chainLen >= 3) out.push({ kind: 'group', type: 'Circuit',  direction, count: chainLen });
  // chainLen >= 4 is folded into the same Circuit option (count = chainLen).
}
