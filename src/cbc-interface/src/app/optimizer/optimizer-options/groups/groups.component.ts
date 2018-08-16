import { Component, OnInit, OnDestroy, DoCheck, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Activity } from '../../../shared/activity.model';
import { OptimizationProblem, Group } from '../../../shared/optimization-problem.model';
import { MyActivitiesService } from '../../../services/my-activities.service';
import { OptimizationService } from '../../../services/optimization.service';
import { UserIdService } from '../../../services/user-id.service';
import { HTTPService } from '../../../services/http.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit, OnDestroy {
  @ViewChild('f') slForm: NgForm;
  problem: OptimizationProblem;
  orderRelation: string;
  subscription: Subscription;
  editMode: boolean;
  editedItemIndex: number;
  editedItem: Group;
  groups: Group[];
  activities: Activity[] = [];
  userId: string;
  private sub: any;

  constructor(
    private myActivitiesService: MyActivitiesService,
    private activatedRoute: ActivatedRoute,
    private optimizationService: OptimizationService,
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

    this.groups = this.optimizationService.getGroups();
    this.optimizationService.problemChanged.subscribe(
      (problem: OptimizationProblem) => {
        this.groups = problem.groups;
      }
    );


   this.subscription = this.optimizationService.startedEditing
    .subscribe(
      (index:number) => {
        this.editMode = true;
        this.editedItemIndex = index;
        this.editedItem = this.optimizationService.getGroup(index);
        this.slForm.setValue({
          activity1: this.editedItem.activity1,
          activity2: this.editedItem.activity2,
        });
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onAddItem(form: NgForm){
    const value = form.value;

    const newGroup = new Group(
      value.activity1,
      value.activity2
    );

    if (this.editMode){
      this.optimizationService.updateGroup(this.editedItemIndex, newGroup);
    }
    else {
      this.optimizationService.addGroup(newGroup);
    }
    this.editMode = false;
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
    this.optimizationService.deleteGroup(this.editedItemIndex);
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
    )
  }
}