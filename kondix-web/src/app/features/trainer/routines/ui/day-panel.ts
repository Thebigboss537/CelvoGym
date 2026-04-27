import {
  ChangeDetectionStrategy, Component, computed, input, output, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { Trash2, Plus, Link2, Unlink2, Timer } from 'lucide-angular';
import { KxExerciseCard } from './exercise-card';
import { computeGroupOptions } from './group-options';
import type {
  WizardDay, WizardBlock, WizardExercise, WizardSet, BlockType, GroupActionEvent,
} from './types';

const ICONS = { Trash2, Plus, Link2, Unlink2, Timer };

const CLUSTER_COLORS: Record<BlockType, string> = {
  Superset: 'var(--color-primary)',
  Triset: '#c084fc',
  Circuit: '#60a5fa',
};

const CLUSTER_LETTERS = ['A', 'B', 'C', 'D', 'E'];

const newSet = (): WizardSet => ({ setType: 'Effective', targetReps: '', targetWeight: '', targetRpe: null, restSeconds: null });
const newExercise = (): WizardExercise => ({ name: '', notes: '', tempo: '', catalogExerciseId: null, catalogImageUrl: null, catalogVideoUrl: null, sets: [newSet()] });

@Component({
  selector: 'kx-day-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CdkDropListGroup, CdkDropList, CdkDrag, LucideAngularModule, KxExerciseCard],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(ICONS) }],
  template: `
    <div class="flex flex-col gap-4">

      <!-- Day header -->
      <div class="flex items-end gap-4 pb-3.5 border-b border-border-light">
        <div class="flex-1 min-w-0">
          <div class="text-overline text-primary mb-1">Día de entreno</div>
          <input type="text"
            [ngModel]="day().name"
            (ngModelChange)="updateDayName($event)"
            [disabled]="isLocked()"
            placeholder="Nombre del día…"
            class="font-display text-3xl font-extrabold text-text bg-transparent w-full focus:outline-none border-b border-transparent focus:border-primary leading-none" />
          <div class="mt-2.5 flex gap-4 text-[11px] text-text-muted font-mono uppercase tracking-wider">
            <span><strong class="text-text-secondary font-display text-sm normal-case tracking-tight">{{ stats().exercises }}</strong> ejercicios</span>
            <span><strong class="text-text-secondary font-display text-sm normal-case tracking-tight">{{ stats().sets }}</strong> series</span>
            <span><strong class="text-text-secondary font-display text-sm normal-case tracking-tight">{{ stats().clusters }}</strong> grupos</span>
          </div>
        </div>
        <button type="button" (click)="removeDay.emit()" [disabled]="isLocked()"
                class="text-text-muted hover:text-danger p-2 rounded transition disabled:opacity-50"
                aria-label="Eliminar día">
          <lucide-angular name="trash-2" [size]="16"></lucide-angular>
        </button>
      </div>

      <!-- Block list with cdkDropListGroup so drags cross between clusters -->
      <div cdkDropListGroup class="flex flex-col gap-3.5">
        @for (block of day().blocks; track $index; let bi = $index) {
          <div
            cdkDropList
            [cdkDropListData]="block.exercises"
            [id]="'block-' + bi"
            (cdkDropListDropped)="onDrop($event, bi)"
            class="relative"
            [class.pl-4]="block.blockType !== null"
            [class.py-2.5]="block.blockType !== null"
            [class.rounded-md]="block.blockType !== null"
            [style.borderLeft]="block.blockType ? '2px solid ' + clusterColor(block.blockType) : null"
            [style.background]="block.blockType ? clusterTint(block.blockType) : null">

            @if (block.blockType !== null) {
              <div class="flex items-center gap-2.5 mb-2.5">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
                      [style.background]="clusterTint(block.blockType, 0.18)"
                      [style.color]="clusterColor(block.blockType)">
                  <lucide-angular name="link-2" [size]="10" class="inline align-text-bottom mr-1"></lucide-angular>
                  {{ block.blockType }}
                </span>
                <div class="flex items-center gap-1.5 text-[11px] text-text-muted font-mono">
                  <lucide-angular name="timer" [size]="11"></lucide-angular>
                  <input type="number" [ngModel]="block.restSeconds"
                         (ngModelChange)="updateBlockRest(bi, $event)"
                         [disabled]="isLocked()"
                         class="bg-transparent text-text-secondary w-12 text-right font-mono focus:outline-none focus:bg-bg-raised rounded px-1" />s desc. entre rondas
                </div>
                <span class="flex-1"></span>
                <button type="button" (click)="ungroupBlock(bi)" [disabled]="isLocked()"
                        class="text-text-muted hover:text-text text-xs flex items-center gap-1 disabled:opacity-50">
                  <lucide-angular name="unlink-2" [size]="12"></lucide-angular>
                  desagrupar
                </button>
              </div>
            }

            <div class="flex flex-col gap-2">
              @for (ex of block.exercises; track $index; let ei = $index) {
                <div cdkDrag [cdkDragData]="{ blockIdx: bi, exIdx: ei }">
                  <kx-exercise-card
                    [exercise]="ex"
                    [badge]="block.blockType !== null ? { label: clusterLetters[ei], color: clusterColor(block.blockType!) } : null"
                    [isInCluster]="block.blockType !== null"
                    [groupOptions]="computeOptionsFor(bi)"
                    [isLocked]="isLocked()"
                    (exerciseChange)="updateExercise(bi, ei, $event)"
                    (delete)="removeExercise(bi, ei)"
                    (duplicate)="duplicateExercise(bi, ei)"
                    (groupAction)="onGroupAction(bi, ei, $event)"
                  />
                </div>
              }
            </div>

            @if (block.blockType !== null) {
              <button type="button" (click)="addToCluster(bi)" [disabled]="isLocked()"
                      class="mt-2 text-xs flex items-center gap-1 disabled:opacity-50"
                      [style.color]="clusterColor(block.blockType)">
                <lucide-angular name="plus" [size]="12"></lucide-angular>
                Añadir al {{ block.blockType.toLowerCase() }}
              </button>
            }
          </div>
        }
      </div>

      <!-- Add zone -->
      <div class="border border-dashed border-border-light/60 rounded-xl p-3.5 flex justify-center gap-2 flex-wrap bg-white/[0.015]">
        <button type="button" (click)="addExercise.emit()" [disabled]="isLocked()"
                class="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition press disabled:opacity-50 flex items-center gap-1.5">
          <lucide-angular name="plus" [size]="14"></lucide-angular>
          Añadir ejercicio
        </button>
        <button type="button" (click)="addSuperset.emit()" [disabled]="isLocked()"
                class="bg-card border border-border hover:border-primary text-text text-sm px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5">
          <lucide-angular name="link-2" [size]="14"></lucide-angular>
          Añadir superset
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* Crimson glowing drop indicator over CDK placeholder */
    :host ::ng-deep .cdk-drop-list-dragging .cdk-drag-placeholder {
      background: var(--color-primary);
      box-shadow: 0 0 12px rgba(230,38,57,0.6);
      height: 3px;
      min-height: 3px;
      border-radius: 2px;
      opacity: 1;
      transition: none;
    }
    :host ::ng-deep .cdk-drag-preview {
      box-sizing: border-box;
      background: var(--color-card);
      border: 1px solid var(--color-primary);
      border-radius: 12px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    }
    :host ::ng-deep .cdk-drag-animating {
      transition: transform 200ms cubic-bezier(0,0,0.2,1);
    }
  `],
})
export class KxDayPanel {
  day = input.required<WizardDay>();
  dayIndex = input.required<number>();
  isLocked = input<boolean>(false);

  dayChange = output<WizardDay>();
  removeDay = output<void>();
  addExercise = output<void>();
  addSuperset = output<void>();

  clusterLetters = CLUSTER_LETTERS;

  stats = computed(() => {
    const day = this.day();
    let exercises = 0, sets = 0, clusters = 0;
    for (const b of day.blocks) {
      exercises += b.exercises.length;
      for (const e of b.exercises) sets += e.sets.length;
      if (b.blockType !== null) clusters++;
    }
    return { exercises, sets, clusters };
  });

  clusterColor(t: BlockType): string { return CLUSTER_COLORS[t]; }
  clusterTint(t: BlockType, alpha = 0.05): string {
    const color = CLUSTER_COLORS[t];
    return `color-mix(in oklch, ${color} ${alpha * 100}%, transparent)`;
  }

  computeOptionsFor(blockIdx: number) {
    return computeGroupOptions(this.day().blocks, blockIdx);
  }

  updateDayName(name: string) {
    this.dayChange.emit({ ...this.day(), name });
  }

  updateBlockRest(bi: number, restSeconds: number) {
    this.dayChange.emit(this.patchBlock(bi, { restSeconds }));
  }

  updateExercise(bi: number, ei: number, ex: WizardExercise) {
    const day = this.day();
    const blocks = day.blocks.map((b, i) =>
      i === bi ? { ...b, exercises: b.exercises.map((e, j) => j === ei ? ex : e) } : b
    );
    this.dayChange.emit({ ...day, blocks });
  }

  removeExercise(bi: number, ei: number) {
    const day = this.day();
    const block = day.blocks[bi];
    const remaining = block.exercises.filter((_, j) => j !== ei);
    let blocks: WizardBlock[];
    if (remaining.length === 0) {
      // Remove the whole block.
      blocks = day.blocks.filter((_, i) => i !== bi);
    } else {
      const isDemoting = remaining.length === 1 && block.blockType !== null;
      const updated: WizardBlock = {
        ...block,
        exercises: remaining,
        // Demote to Single if cluster shrinks to 1; reset rest to Single default
        // so the survivor matches a freshly-created block (90s, not 60s cluster cadence).
        blockType: isDemoting ? null : block.blockType,
        restSeconds: isDemoting ? 90 : block.restSeconds,
      };
      blocks = day.blocks.map((b, i) => i === bi ? updated : b);
    }
    this.dayChange.emit({ ...day, blocks });
  }

  duplicateExercise(bi: number, ei: number) {
    const day = this.day();
    const block = day.blocks[bi];
    const dup = JSON.parse(JSON.stringify(block.exercises[ei])) as WizardExercise;
    const exercises = [...block.exercises.slice(0, ei + 1), dup, ...block.exercises.slice(ei + 1)];
    // If we just made a single-exercise block become 2, promote to Superset.
    const promoted = block.blockType === null && exercises.length === 2
      ? { ...block, blockType: 'Superset' as const, restSeconds: 60, exercises }
      : { ...block, exercises };
    this.dayChange.emit({ ...day, blocks: day.blocks.map((b, i) => i === bi ? promoted : b) });
  }

  addToCluster(bi: number) {
    const day = this.day();
    const block = day.blocks[bi];
    const exercises = [...block.exercises, newExercise()];
    this.dayChange.emit({ ...day, blocks: day.blocks.map((b, i) => i === bi ? { ...b, exercises } : b) });
  }

  ungroupBlock(bi: number) {
    // Demote a cluster back to N single blocks (one per exercise).
    const day = this.day();
    const block = day.blocks[bi];
    const newBlocks: WizardBlock[] = block.exercises.map(e => ({
      blockType: null, restSeconds: 90, exercises: [e],
    }));
    this.dayChange.emit({
      ...day,
      blocks: [...day.blocks.slice(0, bi), ...newBlocks, ...day.blocks.slice(bi + 1)],
    });
  }

  onGroupAction(bi: number, ei: number, action: GroupActionEvent) {
    if (action.kind === 'ungroup') {
      this.ungroupExerciseFromCluster(bi, ei);
      return;
    }
    // kind === 'group': merge `count` neighbors in `direction` with this block.
    const day = this.day();
    const blocks = [...day.blocks];
    const sourceBlock = blocks[bi];
    if (sourceBlock.blockType !== null) return; // safety: already in a cluster

    const range = action.direction === 'up'
      ? { start: bi - action.count, end: bi + 1 }
      : { start: bi, end: bi + action.count + 1 };

    const merged: WizardBlock = {
      blockType: action.type,
      restSeconds: 60,
      exercises: blocks.slice(range.start, range.end).flatMap(b => b.exercises),
    };

    const next = [...blocks.slice(0, range.start), merged, ...blocks.slice(range.end)];
    this.dayChange.emit({ ...day, blocks: next });
  }

  private ungroupExerciseFromCluster(bi: number, ei: number) {
    const day = this.day();
    const block = day.blocks[bi];
    const remaining = block.exercises.filter((_, j) => j !== ei);
    const removed = block.exercises[ei];

    let blocks: WizardBlock[];
    const newSingle: WizardBlock = { blockType: null, restSeconds: 90, exercises: [removed] };

    if (remaining.length === 0) {
      blocks = [...day.blocks.slice(0, bi), newSingle, ...day.blocks.slice(bi + 1)];
    } else if (remaining.length === 1) {
      // Demote to Single + reset rest to Single default (90s, not 60s cluster cadence).
      const demoted: WizardBlock = { ...block, exercises: remaining, blockType: null, restSeconds: 90 };
      blocks = [...day.blocks.slice(0, bi), demoted, newSingle, ...day.blocks.slice(bi + 1)];
    } else {
      const trimmed: WizardBlock = { ...block, exercises: remaining };
      blocks = [...day.blocks.slice(0, bi), trimmed, newSingle, ...day.blocks.slice(bi + 1)];
    }
    this.dayChange.emit({ ...day, blocks });
  }

  onDrop(event: CdkDragDrop<WizardExercise[]>, targetBi: number) {
    const day = this.day();
    if (event.previousContainer === event.container) {
      // Reorder within same block.
      const block = day.blocks[targetBi];
      const exercises = [...block.exercises];
      moveItemInArray(exercises, event.previousIndex, event.currentIndex);
      this.dayChange.emit({ ...day, blocks: day.blocks.map((b, i) => i === targetBi ? { ...b, exercises } : b) });
      return;
    }

    // Cross-block move.
    const fromBi = Number((event.previousContainer.id ?? '').replace('block-', ''));
    if (Number.isNaN(fromBi)) return;
    const blocks = day.blocks.map(b => ({ ...b, exercises: [...b.exercises] }));
    const moved = blocks[fromBi].exercises.splice(event.previousIndex, 1)[0];
    blocks[targetBi].exercises.splice(event.currentIndex, 0, moved);

    // Cleanup: empty source → remove; cluster of 1 → demote to Single + reset rest
    // to the Single default (90s) so the survivor matches a freshly-created block.
    const cleaned = blocks
      .filter(b => b.exercises.length > 0)
      .map(b => b.exercises.length === 1 && b.blockType !== null
        ? { ...b, blockType: null, restSeconds: 90 }
        : b);

    this.dayChange.emit({ ...day, blocks: cleaned });
  }

  private patchBlock(bi: number, patch: Partial<WizardBlock>): WizardDay {
    const day = this.day();
    return { ...day, blocks: day.blocks.map((b, i) => i === bi ? { ...b, ...patch } : b) };
  }
}
