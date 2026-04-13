import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CgToast } from './shared/ui/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CgToast],
  template: `<router-outlet /><cg-toast />`,
})
export class App {}
