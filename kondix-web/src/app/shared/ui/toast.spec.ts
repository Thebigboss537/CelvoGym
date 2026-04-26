import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast';

describe('ToastService.showPR', () => {
  let service: ToastService;

  beforeEach(() => {
    jasmine.clock().install();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('sets a pr-type toast with title and formatted message', () => {
    service.showPR('Press banca', '75', 8);
    const t = service.toast();
    expect(t).not.toBeNull();
    expect(t!.type).toBe('pr');
    expect(t!.title).toBe('¡Nuevo récord!');
    expect(t!.message).toBe('Press banca · 75kg × 8');
  });

  it('omits the reps separator when reps is null', () => {
    service.showPR('Sentadilla', '120', null);
    expect(service.toast()!.message).toBe('Sentadilla · 120kg');
  });

  it('auto-dismisses after 4000ms', () => {
    service.showPR('Peso muerto', '180', 5);
    expect(service.toast()).not.toBeNull();
    jasmine.clock().tick(3999);
    expect(service.toast()).not.toBeNull();
    jasmine.clock().tick(1);
    expect(service.toast()).toBeNull();
  });
});
