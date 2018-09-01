import { Component, OnInit, OnDestroy, DoCheck, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Activity } from '../../../shared/activity.model';
import { 
  OptimizationProblem, 
  OrderConstraint,
  Deadline 
} from '../../../shared/optimization-problem.model';
import { MyActivitiesService } from '../../../services/my-activities.service';
import { OptimizationService } from '../../../services/optimization.service';
import { UserIdService } from '../../../services/user-id.service';
import { HTTPService } from '../../../services/http.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit, OnDestroy {
  @ViewChild('f') slForm: NgForm;
  problem: OptimizationProblem;
  orderRelation: string;
  subscription: Subscription;
  editMode: boolean;
  editedItemIndex: number;
  editedItem: OrderConstraint;
  constraints: OrderConstraint[];
  deadlines: Deadline[];
  activities: Activity[] = [];
  errorMessage: string;
  userId: string;
  private: any;

  constructor(
    private myActivitiesService: MyActivitiesService,
    private optimizationService: OptimizationService,
    private activatedRoute: ActivatedRoute,
    private userIdService: UserIdService,
    private httpService: HTTPService
  ) { }

  ngOnInit() {
    this.editMode=false;

    this.getActivities(this.userId);
    this.myActivitiesService.activitiesChanged.subscribe(
      (activities: Activity[]) => {
        this.activities = activities;
      }
    );

    this.constraints = this.optimizationService.getConstraints();
    this.deadlines = this.optimizationService.getDeadlines();
    this.optimizationService.problemChanged.subscribe(
      (problem: OptimizationProblem) => {
        this.constraints = problem.constraints;
        this.deadlines = problem.deadlines;
      }
    );


   this.subscription = this.optimizationService.startedEditing
    .subscribe(
      (index:number) => {
        this.editMode = true;
        this.editedItemIndex = index;
        this.editedItem = this.optimizationService.getConstraint(index);
        this.slForm.setValue({
          orderActivity1: this.editedItem.firstActivity,
          orderRelation: this.editedItem.order,
          orderActivity2: this.editedItem.secondActivity
        });
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getAssignedActivities(){
    var activityNames = [];
    for (var i=0; i<this.deadlines.length; i++){
      activityNames.push(this.deadlines[i].activity);
    }
    return activityNames;
  }

  checkDay(activity1: string, activity2: string){
    // Get the day of the first activity
    let firstDay = null;
    for(var i=0; i<this.deadlines.length; i++){
      if(this.deadlines[i].activity===activity1){
        firstDay = this.deadlines[i].dueDate;
      }
    }

    // Get the day of the second activity
    let secondDay = null;
    for(var i=0; i<this.deadlines.length; i++){
      if(this.deadlines[i].activity===activity2){
        secondDay = this.deadlines[i].dueDate;
      }
    }

    if(secondDay===firstDay){
      return true
    }
    else{
      return false
    }

  }

  checkExisting(activity1: string, activity2: string){
    for(var i=0; i<this.constraints.length; i++){
      var activities = [
        this.constraints[i].firstActivity, 
        this.constraints[i].secondActivity
      ]
      if(activities.indexOf(activity1) != -1){
        if(activities.indexOf(activity2) != -1){
          if(this.editMode===false){
            return true
          }
        }
      }
      return false
    }
  }

  onAddItem(form: NgForm){
    const value = form.value;

    if(value.orderActivity1===value.orderActivity2){
      this.errorMessage='Error: Both activities are the same';
      return 
    }

    if(this.checkDay(value.orderActivity1, value.orderActivity2)==false){
      this.errorMessage='Error: Activities assigned to different days';
      return 
    }
    
    if(this.checkExisting(value.orderActivity1, value.orderActivity2)==true){
      this.errorMessage='Error: Existing constraint for these activities';
      return 
    }

    const newConstraint = new OrderConstraint(
      value.orderActivity1, 
      value.orderRelation, 
      value.orderActivity2
    );

    if (this.editMode){
      this.optimizationService.updateConstraint(this.editedItemIndex, newConstraint);
    }
    else {
      this.optimizationService.addConstraint(newConstraint);
    }
    this.editMode = false;
    this.errorMessage = null;
    form.reset();
  }

  onEditItem(index: number){
    this.optimizationService.startedEditing.next(index);
  }
  
  onClear(){
    this.slForm.reset();
    this.editMode = false;
  }

  onDelete(){
    this.optimizationService.deleteConstraint(this.editedItemIndex);
    this.onClear();
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

}
