import { Routes } from '@angular/router';
import { CardCreatorComponent } from './components/card-creator/card-creator.component';

export const routes: Routes = [
  { path: '', component: CardCreatorComponent },
  { path: '**', redirectTo: '' },
];
