import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Activity } from '../shared/activity.model';

import { MyActivitiesService } from '../services/my-activities.service';
import { HTTPService } from '../services/http.service';
import { UserIdService } from '../services/user-id.service';

@Component({
  selector: 'app-startpoint',
  templateUrl: './startpoint.component.html',
  styleUrls: ['./startpoint.component.css']
})
export class StartpointComponent implements OnInit {
  @ViewChild('f') startForm: NgForm;
  @ViewChild('f2') endForm: NgForm;
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
    private httpService: HTTPService,
    private userIdService: UserIdService,
    private activatedRoute: ActivatedRoute
  ) { }


  ngOnInit() {
    this.sub = this.activatedRoute.params.subscribe(params =>{
      this.userId = params['userId'];
      this.userIdService.setUserId(this.userId);
    })

    this.getActivities(this.userId);
    this.myActivitiesService.activitiesChanged.subscribe(
      (activities: Activity[]) => {
        this.activities = activities;
      }
    );

    this.getEndpoint(this.userId, 'start');
    this.myActivitiesService.startChanged.subscribe(
      (start: Activity) => {
        this.start = start;
      }
    );    
    
    this.getEndpoint(this.userId, 'finish');
    this.end = this.myActivitiesService.getEnd();
    this.myActivitiesService.endChanged.subscribe(
      (end: Activity) => {
        this.end = end;
      }
    );

    // Post metrics to the usage table
    this.postMetrics(this.userId, 'startpoint');
  }

  onSubmit(form: NgForm, type: string){
    const value = form.value;
    var id = null;
    var caseName = null;
    var activityType = null;
    var expectedDuration = null;
    var address = value.address;
    var city = value.city;
    var state = value.state;
    var zipCode = value.zipCode;
    var completed = null;

    this.httpService.convertAddress(address, city, state, zipCode)
      .subscribe(
        (coordinates: number[]) => {
          const value = form.value;
          var newActivity = new Activity (
            id,
            caseName,
            activityType,
            expectedDuration,
            address,
            city,
            state,
            zipCode,
            coordinates,
            completed
          )
          if(type==='start'){
            this.postEndpoint(newActivity, 'start');
            this.myActivitiesService.setStart(newActivity);
          }
          else if(type==='end'){
            this.postEndpoint(newActivity, 'finish');
            this.myActivitiesService.setEnd(newActivity);
          }
          form.reset();
          return newActivity;
         },
        (error) => console.log(error)
      );
    form.reset();

  }

  onEdit(type: string){
    if (type==='start'){
      this.startForm.setValue({
        address: this.start.address,
        city: this.start.city,
        state: this.start.state,
        zipCode: this.start.zipCode
      })
    }
    else if (type==='end'){
      this.endForm.setValue({
        address: this.end.address,
        city: this.end.city,
        state: this.end.state,
        zipCode: this.end.zipCode
      })
    }
  }

  onClear(type: string){
    if (type==='start'){
      this.startForm.reset();
    }
    else if (type==='end'){
      this.endForm.reset();
    }
  }

  postEndpoint(location: Activity, type: string){
    this.httpService.updateEndpoint(location, this.userId, type)
      .subscribe(
        (data) => console.log(data),
        (error) => console.log(error)
      );
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
