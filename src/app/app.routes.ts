import { Routes } from '@angular/router';
import { CardCreatorComponent } from './components/electron/card-creator/card-creator.component';
import { MenuComponent } from './components/electron/menu/menu.component';
import { GameComponent } from './components/browser/game/game.component';

export const routes: Routes = [
  { path: '', component: MenuComponent },
  { path: 'create', component: CardCreatorComponent},
  { path: 't', component: GameComponent},
  { path: '**', redirectTo: '' },
];
