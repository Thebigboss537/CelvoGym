import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KxToast } from './shared/ui/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, KxToast],
  template: `<router-outlet /><kx-toast />`,
})
export class App {}
