import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Activity } from '../shared/activity.model';
import { MyActivitiesService } from '../services/my-activities.service';
import { UserIdService } from '../services/user-id.service';
import { HTTPService } from '../services/http.service';

@Component({
  selector: 'app-my-activities',
  templateUrl: './my-activities.component.html',
  styleUrls: ['./my-activities.component.css']
})
export class MyActivitiesComponent implements OnInit {
  activities: Activity[] = [];
  start: Activity = new Activity(
    null, null, null, null, null, null, null, null, null, null
  );
  end: Activity = new Activity(
    null, null, null, null, null, null, null, null, null, null
  );
  userId: string;
  private sub: any;

  constructor(
    private myActivitiesService: MyActivitiesService,
    private activatedRoute: ActivatedRoute,
    private userIdService: UserIdService,
    private httpService: HTTPService
  ) { }

  ngOnInit() {
    this.sub = this.activatedRoute.params.subscribe(params=>{
      this.userId = params['userId'];
      this.userIdService.setUserId(this.userId);
    });

    this.getActivities(this.userId);
    this.myActivitiesService.activitiesChanged.subscribe(
      (activities: Activity[]) => {
        this.activities = activities;
      }
    );

    // Subscribe to start updates
    this.getEndpoint(this.userId, 'start');
    this.myActivitiesService.startChanged.subscribe(
      (start: Activity) => {
        this.start = start;
      }
    );

    // Subscribe to end updates
    this.getEndpoint(this.userId, 'finish');
    this.myActivitiesService.endChanged.subscribe(
      (end: Activity) => {
        this.end = end;
      }
    );

    // Post metrics to the usage table
    this.postMetrics(this.userId, 'my_activities')

  }

  onEditItem(index: number){
    this.myActivitiesService.startedEditing.next(index);
  }

  getActivities(userId: string){
    this.httpService.getActivities(userId)
      .subscribe(
        (data) => {
          var activities = [];
          for(var i=0; i<data.length; i++){
            var completed = data[i].completed == "1";
            var activity = new Activity(
              parseInt(data[i].id),
              data[i].caseName,
              data[i].activityType,
              data[i].expectedDuration,
              data[i].address,
              data[i].city,
              data[i].state,
              data[i].zipCode,
              [data[i].coordinates[0], data[i].coordinates[1]],
              completed
            )
            activities.push(activity);
          }
          this.activities = activities;
          this.myActivitiesService.setActivities(activities);
        },
        (error) => console.log(error)
    );
  }

  getEndpoint(userId: string, type: string){
    this.httpService.getEndpoint(userId, type)
      .subscribe(
        (data) => {
          var location = new Activity(
            null,
            null,
            null,
            null,
            data.address,
            data.city,
            data.state,
            data.zipCode,
            [data.coordinates[0], data.coordinates[1]],
            null
          )
          if(type==='start'){
           this.start = location;
           this.myActivitiesService.setStart(location);
          }
          else if(type ==='finish'){
           this.end = location;
           this.myActivitiesService.setEnd(location);
          }
        },
        (error) => console.log(error)
    );
  }

 postMetrics(userId: string, action: string){
   this.httpService.postMetrics(userId, action)
     .subscribe(
        (data) => console.log(data),
        (error) => console.log(error)
    )
 }
}
