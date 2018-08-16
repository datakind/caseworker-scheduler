import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Activity } from '../../shared/activity.model';
import { MyActivitiesService } from '../../services/my-activities.service';
import { HTTPService } from '../../services/http.service';
import { UserIdService } from '../../services/user-id.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-activities-edit',
  templateUrl: './my-activities-edit.component.html',
  styleUrls: ['./my-activities-edit.component.css']
})
export class MyActivitiesEditComponent implements OnInit, OnDestroy {
  @ViewChild('f') slForm: NgForm;
  subscription: Subscription;
  editMode = false;
  editedItemIndex: number;
  editedItem: Activity;
  userId: string;
  private sub: any;

  constructor(
      private myActivitiesService: MyActivitiesService,
      private activatedRoute: ActivatedRoute,
      private httpService: HTTPService,
      private userIdService: UserIdService
    ) { }

  ngOnInit() {
    // Pull in the user id from the url
    this.sub = this.activatedRoute.params.subscribe(params=>{
      this.userId = params['userId'];
      this.userIdService.setUserId(this.userId);
    });

    this.subscription = this.myActivitiesService.startedEditing
      .subscribe(
        (index:number) => {
          this.editMode = true;
          this.editedItemIndex = index;
          this.editedItem = this.myActivitiesService.getActivity(index);
          this.slForm.setValue({
            caseName: this.editedItem.caseName,
            activityType: this.editedItem.activityType,
            expectedDuration: this.editedItem.expectedDuration,
            address: this.editedItem.address,
            city: this.editedItem.city,
            state: this.editedItem.state,
            zipCode: this.editedItem.zipCode,
            completed: this.editedItem.completed
          })
        }
      );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onAddItem(form: NgForm){
    const value = form.value;
    var caseName = value.caseName;
    var activityType = value.activityType;
    var expectedDuration = value.expectedDuration;
    var address = value.address;
    var city = value.city;
    var state = value.state;
    var zipCode = value.zipCode;
    var completed = value.completed;

    this.httpService.convertAddress(address, city, state, zipCode)
      .subscribe(
        (coordinates: number[]) => {
          const value = form.value;
          var id = this.myActivitiesService.getActivityId(
              caseName + ' ' + activityType
          )
          if(id===null){
            id = this.myActivitiesService.getNextID();
          }
          console.log(id);
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
          if (this.editMode){
            this.myActivitiesService.updateActivity(this.editedItemIndex, newActivity);
          } else {
            this.myActivitiesService.addActivity(newActivity);
          }
          this.postActivity(newActivity);
          this.editMode = false;
          form.reset();
          return newActivity;
         },
        (error) => console.log(error)
      );
  }

  onClear(){
    this.slForm.reset();
    this.editMode = false;
  }

  onDelete(){
    this.myActivitiesService.deleteActivity(this.editedItemIndex);
    this.deleteActivity(this.userId, this.editedItem.id);
    this.onClear();
  }

  postActivity(activity: Activity){
    this.httpService.addActivity(activity, this.userId)
      .subscribe(
        (data) => console.log(data),
        (error) => console.log(error)
      );
  }

  deleteActivity(userId: string, id: number){
    this.httpService.deleteActivity(userId, id.toString())
      .subscribe(
        (data) => console.log(data),
        (error) => console.log(error)
      );
  }

}

