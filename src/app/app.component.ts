import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { options } from './isgame';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(router: Router) {
    if (options.company)
      router.navigate(["game"]);
    else router.navigate([""]);
  }
  title = 'test';
}
