import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyActivitiesComponent } from './my-activities/my-activities.component';
import { ComplexityComponent } from './complexity/complexity.component'
import { OptimizerComponent } from './optimizer/optimizer.component'
import { LeafletComponent } from './optimizer/leaflet/leaflet.component'
import { StartpointComponent } from './startpoint/startpoint.component'

const appRoutes: Routes = [
  { path: '', redirectTo: '/my-activities/default', pathMatch: 'full' },
  { path: 'my-activities', redirectTo: '/my-activities/default', pathMatch: 'full' },
  { path: 'my-activities/:userId', component: MyActivitiesComponent },
  { path: 'optimizer', redirectTo: '/optimizer/default', pathMatch: 'full' },
  { path: 'optimizer/:userId', component: OptimizerComponent },
  { path: 'startpoint', redirectTo: '/startpoint/default', pathMatch: 'full'},
  { path: 'startpoint/:userId', component: StartpointComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
