import { Component, OnInit, OnDestroy, DoCheck, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Activity } from '../../../shared/activity.model';
import { OptimizationProblem, Deadline } from '../../../shared/optimization-problem.model';
import { MyActivitiesService } from '../../../services/my-activities.service';
import { OptimizationService } from '../../../services/optimization.service';
import { UserIdService } from '../../../services/user-id.service';
import { HTTPService } from '../../../services/http.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-deadline',
  templateUrl: './deadline.component.html',
  styleUrls: ['./deadline.component.css']
})
export class DeadlineComponent implements OnInit, OnDestroy {
  @ViewChild('f') slForm: NgForm;
  problem: OptimizationProblem;
  orderRelation: string;
  subscription: Subscription;
  editMode: boolean;
  editedItemIndex: number;
  editedItem: Deadline;
  deadlines: Deadline[] = [];
  activities: Activity[] = [];
  availableActivities: Activity[] = [];
  days: string[];
  userId: string;
  private sub: any;
  errorMessage = null;

  constructor(
    private myActivitiesService: MyActivitiesService,
    private optimizationService: OptimizationService,
    private activatedRoute: ActivatedRoute,
    private userIdService: UserIdService,
    private httpService: HTTPService
  ) { }

  ngOnInit() {
    this.sub = this.activatedRoute.params.subscribe(params=>{
      this.userId = params['userId'];
      this.userIdService.setUserId(this.userId);
    });

    this.editMode=false;

    this.getActivities(this.userId);
    this.myActivitiesService.activitiesChanged.subscribe(
      (activities: Activity[]) => {
        this.activities = activities;
      }
    );

    this.deadlines = this.optimizationService.getDeadlines();
    this.getDays();
    this.optimizationService.problemChanged.subscribe(
      (problem: OptimizationProblem) => {
        this.deadlines = problem.deadlines;
        this.getDays();
      }
    );


   this.subscription = this.optimizationService.startedEditing
    .subscribe(
      (index:number) => {
        this.editMode = true;
        this.editedItemIndex = index;
        this.editedItem = this.optimizationService.getDeadline(index);
        this.slForm.setValue({
          deadlineActivity: this.editedItem.activity,
          deadlineDay: this.editedItem.dueDate
        });
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getAvailableActivities(){
    // See which activities have been assigned
    var assignedActivities = [];
    for (var i=0; i<this.deadlines.length; i++){
      assignedActivities.push(this.deadlines[i].activity);
    }

    // See which activities are available
    var availableActivities = [];
    for (var i=0; i<this.activities.length; i++){
      var activity = this.activities[i];
      var activityName = [activity.caseName, activity.activityType].join(' ');
      if(assignedActivities.indexOf(activityName)==-1){
        availableActivities.push(activity);
      }
    }
    this.availableActivities = availableActivities;
  }

  checkExisting(activity: string){
    for(var i=0; i<this.deadlines.length; i++){
      var deadline = this.deadlines[i];
      if(deadline.activity===activity){
        if(this.editMode===false){
          return true
        }
      }
    }
  }

  onAddItem(form: NgForm){
    const value = form.value;

    if(this.checkExisting(value.deadlineActivity)==true){
      this.errorMessage='Error: Existing constraint for this activity';
      return 
    }

    const newDeadline = new Deadline(
      value.deadlineActivity,
      value.deadlineDay
    );

    if (this.editMode){
      this.optimizationService.updateDeadline(this.editedItemIndex, newDeadline);
    }
    else {
      this.optimizationService.addDeadline(newDeadline);
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
    this.optimizationService.deleteDeadline(this.editedItemIndex);
    this.onClear();
  }

  getDays(){
    var hours = this.optimizationService.getHours();
    var days = [];
    for(var day in hours){
      var dayHours = hours[day];
      if(dayHours>0){
        var firstLetter = day[0].toUpperCase();
        var rest = day.slice(1,);
        var dayName = firstLetter + rest;
        days.push(dayName);
      }
    }
    this.days = days;
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
          this.getAvailableActivities();
        },
        (error) => console.log(error)
    );
  }
}
