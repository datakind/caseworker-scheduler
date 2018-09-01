import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NgModule } from '@angular/core';

import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { DropdownDirective } from './shared/dropdown.directive';
import { AppRoutingModule } from './app-routing.module';
import { MyActivitiesComponent } from './my-activities/my-activities.component';
import { MyActivitiesEditComponent } from './my-activities/my-activities-edit/my-activities-edit.component';
import { MyActivitiesService } from './services/my-activities.service';
import { UserIdService } from './services/user-id.service';
import { ComplexityComponent } from './complexity/complexity.component';
import { OptimizerComponent } from './optimizer/optimizer.component';
import { LeafletComponent } from './optimizer/leaflet/leaflet.component';
import { OptimizerOptionsComponent } from './optimizer/optimizer-options/optimizer-options.component';
import { OptimizationService } from './services/optimization.service';
import { ScheduleComponent } from './optimizer/schedule/schedule.component';
import { ObjectiveComponent } from './optimizer/optimizer-options/objective/objective.component';
import { HoursComponent } from './optimizer/optimizer-options/hours/hours.component';
import { OrderComponent } from './optimizer/optimizer-options/order/order.component';
import { DeadlineComponent } from './optimizer/optimizer-options/deadline/deadline.component'
import { HTTPService } from './services/http.service';
import { ActivityRouterService } from './services/activity-router.service';
import { GroupsComponent } from './optimizer/optimizer-options/groups/groups.component';
import { StartpointComponent } from './startpoint/startpoint.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    DropdownDirective,
    MyActivitiesComponent,
    MyActivitiesEditComponent,
    ComplexityComponent,
    OptimizerComponent,
    LeafletComponent,
    OptimizerOptionsComponent,
    ScheduleComponent,
    ObjectiveComponent,
    HoursComponent,
    OrderComponent,
    DeadlineComponent,
    GroupsComponent,
    StartpointComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    AppRoutingModule,
    LeafletModule.forRoot()
  ],
  providers: [
    MyActivitiesService, 
    OptimizationService,
    HTTPService,
    ActivityRouterService,
    UserIdService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
