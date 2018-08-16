import { EventEmitter } from '@angular/core';
import { Headers, Http, Response, URLSearchParams } from '@angular/http';
import 'rxjs/Rx';
import { Activity } from '../shared/activity.model';
import { Subject } from 'rxjs/Subject';

declare function require(name:string);
const config = require('../shared/config.json');
let BASE_URL = config.url;

export class MyActivitiesService {
  activitiesChanged = new EventEmitter<Activity[]>();
  startChanged = new EventEmitter<Activity>();
  endChanged = new EventEmitter<Activity>();
  startedEditing = new Subject<number>();
  orderedActivities = {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []};
  days: string[];
  dayMap: object;
  distanceMatrix;
  scheduleStart;
  scheduleEnd;
  private start: Activity = new Activity(
    null, null, null, null, null, null, null, null, null, null
  );
  private end: Activity = new Activity(
    null, null, null, null, null, null, null, null, null, null
  );
  private activities: Activity[] = [];

  getStart() {
    return this.start;
  }

  setStart(start: Activity){
    this.start = start;
    this.startChanged.next(this.start);

  }
  
  getEnd(){
    return this.end
  }

  setEnd(end: Activity){
    this.end = end;
    this.endChanged.next(this.end);
  }

  getActivities() {
    return this.activities.slice();
  }

  setActivities(activities: Activity[]){
    this.activities = activities;
  }

  getToDoActivities(){
    var activities = [];
    for(var i=0; i<this.activities.length; i++){
      var activity = this.activities[i];
      if(activity.completed==false){
        activities.push(activity);
      }
    }
    return activities;
  }

  getActivity(index: number){
    return this.activities[index];
  }

  addActivity(activity: Activity){
    this.activities.push(activity);
    this.activitiesChanged.emit(this.activities.slice())
  }

  updateActivity(index: number, newActivity: Activity){
    this.activities[index] = newActivity;
    this.activitiesChanged.next(this.activities.slice());
  }

  addActivities(activities: Activity[]){
    this.activities.push(...activities);
    this.activitiesChanged.emit(this.activities.slice());
  }

  deleteActivity(index: number){
    this.activities.splice(index,1);
    this.activitiesChanged.next(this.activities.slice());
  }

  getNextID(){
    var maxID = 0;
    for(var i = 0; i < this.activities.length; i++){
      var activity = this.activities[i];
      if(activity.id > maxID){
        var maxID = activity.id;
      }
    }
    var nextID = maxID + 1;
    return nextID
  }

  getActivityById(id: number){
    for(var i = 0; i < this.activities.length; i++){
      if(this.activities[i].id == id){
        return this.activities[i];
      }
    }
    return null
  }

  getActivityId(activityName: string){
    for(var i = 0; i < this.activities.length; i++){
      var activity = this.activities[i];
      var thisActivityName = activity.caseName + ' ' + activity.activityType;
      if(thisActivityName == activityName){
        return activity.id;
      }
    }
    return null
  }

  // Persist the output of the optimizer
  // for the activities schedule

  setOrderedActivities(activities){
    this.orderedActivities = activities;
  }

  getOrderedActivities(){
    return this.orderedActivities;
  }
  
  setDistanceMatrix(distanceMatrix){
    this.distanceMatrix = distanceMatrix;
  }

  getDistanceMatrix(){
    return this.distanceMatrix;
  }

  // Persist the days and mapping for the
  // activities schedule

  setDays(days: string[]){
    this.days = days;
  }

  getDays(){
    return this.days;
  }

  setDayMap(dayMap){
    this.dayMap = dayMap;
  }

  getDayMap(){
    return this.dayMap;
  }

  // Persist the schedule start and
  // end locations for the schedule

  setScheduleStart(scheduleStart){
    this.scheduleStart = scheduleStart;
  }

  getScheduleStart(){
    return this.scheduleStart;
  }

  setScheduleEnd(scheduleEnd){
    this.scheduleEnd = scheduleEnd;
  }

  getScheduleEnd(){
    return this.scheduleEnd;
  }

}
