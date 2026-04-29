import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ProgramsService } from './programs.service';
import { ProgramDetail } from '../../../../shared/models';

interface SelectedCell { weekIndex: number; dayIndex: number; }

interface State {
  program: ProgramDetail | null;
  loading: boolean;
  error: string | null;
  selected: SelectedCell | null;
}

const initial: State = { program: null, loading: false, error: null, selected: null };

export const ProgramEditorStore = signalStore(
  withState<State>(initial),
  withMethods((store, programs = inject(ProgramsService)) => {
    const reload = async (id: string) => {
      patchState(store, { loading: true, error: null });
      try {
        const program = await firstValueFrom(programs.getById(id));
        patchState(store, { program, loading: false });
      } catch (e: any) {
        patchState(store, { error: e?.message ?? 'Error', loading: false });
      }
    };

    return {
      reload,
      selectCell(weekIndex: number, dayIndex: number) {
        patchState(store, { selected: { weekIndex, dayIndex } });
      },
      clearSelection() {
        patchState(store, { selected: null });
      },
      async updateMeta(id: string, payload: Parameters<ProgramsService['update']>[1]) {
        await firstValueFrom(programs.update(id, payload));
        await reload(id);
      },
      async publish(id: string) {
        await firstValueFrom(programs.publish(id));
        await reload(id);
      },
      async addWeek(id: string) {
        await firstValueFrom(programs.addWeek(id));
        await reload(id);
      },
      async duplicateWeek(id: string, weekIndex: number) {
        await firstValueFrom(programs.duplicateWeek(id, weekIndex));
        await reload(id);
      },
      async deleteWeek(id: string, weekIndex: number) {
        await firstValueFrom(programs.deleteWeek(id, weekIndex));
        await reload(id);
      },
      async setSlot(id: string, weekIndex: number, dayIndex: number, kind: 'Empty' | 'Rest') {
        await firstValueFrom(programs.setSlot(id, weekIndex, dayIndex, kind));
        await reload(id);
      },
      async assignRoutine(id: string, payload: Parameters<ProgramsService['assignRoutine']>[1]) {
        await firstValueFrom(programs.assignRoutine(id, payload));
        await reload(id);
      },
      async removeBlock(id: string, blockId: string) {
        await firstValueFrom(programs.removeBlock(id, blockId));
        await reload(id);
      },
      async fillRest(id: string) {
        await firstValueFrom(programs.fillRest(id));
        await reload(id);
      },
    };
  })
);

export type ProgramEditorStoreType = InstanceType<typeof ProgramEditorStore>;
