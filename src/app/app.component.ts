import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { options } from './isgame';
import { ElectronService } from './shared/services/electron.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(d: ElectronService, router: Router) {
    if (!d.isElectron) router.navigate(['game']);
    else router.navigate(['']);
  }
}
