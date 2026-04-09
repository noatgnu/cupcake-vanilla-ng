import { Routes } from '@angular/router';
import { Taskpane } from './taskpane/taskpane';

export const routes: Routes = [
  { path: '', component: Taskpane },
  { path: '**', redirectTo: '' }
];
