import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Activity } from '../../shared/activity.model';
import { MyActivitiesService } from '../../services/my-activities.service';
import { OptimizationService } from '../../services/optimization.service';
import { ActivityRouterService } from '../../services/activity-router.service';
import { OptimizationProblem } from '../../shared/optimization-problem.model';
import { UserIdService } from '../../services/user-id.service';
import { HTTPService } from '../../services/http.service';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {
  activities: Activity[] = [];
  start: Activity = new Activity(
    null, null, null, null, null, null, null, null, null, null
  );
  end: Activity = new Activity(
    null, null, null, null, null, null, null, null, null, null
  );
  scheduleStart: Activity = new Activity(
    null, null, null, null, null, null, null, null, null, null
  );
  scheduleEnd: Activity = new Activity(
    null, null, null, null, null, null, null, null, null, null
  );
  orderedActivities;
  days: string[] = [];
  problem: OptimizationProblem;
  optimized: boolean;
  dayMap = {};
  allDays=[0,1,2,3,4];
  distanceMatrix;
  userId: string;
  private sub: any;
  email: string = null;
  emailSuccess: boolean = null;

  constructor(
    private myActivitiesService: MyActivitiesService,
    private optimizationService: OptimizationService,
    private activityRouterService: ActivityRouterService,
    private activatedRoute: ActivatedRoute,
    private userIdService: UserIdService,
    private httpService: HTTPService
  ) { }

  ngOnInit() {
    this.optimized=true

    // Update the day map
    this.updateDayMap(); 
       
    // Pull in the user id from the url
    this.sub = this.activatedRoute.params.subscribe(params=>{
      this.userId = params['userId'];
      this.userIdService.setUserId(this.userId);
    });

    // Subscribe to activity updates
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
    
    this.orderedActivities = this.myActivitiesService.getOrderedActivities();
    this.getSavedSchedule(this.userId);

    // Get existing schedule
    this.distanceMatrix = this.myActivitiesService.getDistanceMatrix();

    // Subscribe to updates to the optimization problem
    this.problem = this.optimizationService.getProblem();
    this.optimizationService.problemChanged.subscribe(
      (problem: OptimizationProblem) => {
        this.problem = problem;
      }
    );

    // Post metrics to the usage table
    this.postMetrics(this.userId, 'schedule');
  }

  emailSchedule(){
    var schedule = this.buildSchedule();
    var emailBody = {
      'destination': this.email,
      'schedule': schedule
    };  
    this.httpService.emailSchedule(emailBody)
      .subscribe(
        (data) => {
          console.log(data)
          this.emailSuccess=data.success;
          console.log(this.emailSuccess);
        },
        (error) => console.log(error)
      );
  }

  onSend(){
    this.postMetrics(this.userId, 'email');
    this.emailSchedule()
    var schedule = this.buildSchedule();
    var emailBody = {
      'destination': this.email,
      'schedule': schedule
    }
    console.log(emailBody);
  }

  onClick(){
    this.postMetrics(this.userId, 'optimize');
    this.activityRouterService.buildSchedule()
      .subscribe(
        (resp) => {
          // Update the day map
          this.updateDayMap();
          this.myActivitiesService.setDayMap(this.dayMap);


          // Initialize variables
          this.distanceMatrix = resp.schedule.distance_matrix;
          this.myActivitiesService.setDistanceMatrix(this.distanceMatrix);
          this.myActivitiesService.setScheduleStart(this.start);
          this.myActivitiesService.setScheduleEnd(this.end);

          var order = resp.schedule.order;
          var activityOrder = resp.schedule.activities;
          var orderedActivities = {};
          for(day in this.dayMap){
            orderedActivities[day] = [];
          }
          var days = [];

          for(var i = 0; i < activityOrder.length; i++){
            // Add the activity to the order list
            var id = parseInt(activityOrder[i].label);
            var activity = this.myActivitiesService.getActivityById(id);

            // Add the day
            var day = activityOrder[i].assigned_day;
            orderedActivities[day].push(activity);
            days.push(day);
          }
          // Update ordered activities
          this.orderedActivities = orderedActivities;
          this.myActivitiesService.setOrderedActivities(this.orderedActivities);
          this.scheduleStart = this.start;
          this.scheduleEnd = this.end;
          this.myActivitiesService.setStart(this.start);

          // Update the days
          this.days = days;
          this.myActivitiesService.setDays(days);
          this.optimized=true;

          // Post the updated schedule
          this.postSchedule();
         },
        (error) => console.log(error)
      );
  }

  updateDayMap(){
    var dayMap = {
      0 : 'Monday',
      1 : 'Tuesday',
      2 : 'Wednesday',
      3 : 'Thursday',
      4 : 'Friday',
      6 : 'Saturday',
      7 : 'Sunday'
    };
    this.dayMap = dayMap;
  }

  onMoveUp(i:number, day:number){
    if(i>0){
      var j = i-1;
      var updatedActivities = [];
      for(var k=0; k < this.orderedActivities[day].length; k++){
        if(k==i){
          var updatedActivity = this.orderedActivities[day][j];
        }
        else if(k==j){
          var updatedActivity = this.orderedActivities[day][i];
        }
        else{
          var updatedActivity = this.orderedActivities[day][k];
        }
        updatedActivities.push(updatedActivity);
      }
      this.orderedActivities[day] = updatedActivities;
    }
    else{
      var firstActivity = this.orderedActivities[day].shift();
      this.orderedActivities[day-1].push(firstActivity);
    }
    this.myActivitiesService.setOrderedActivities(this.orderedActivities);
    this.postSchedule();
  }

  onMoveDown(i:number, day:number){
    if(i<this.orderedActivities[day].length-1){
      var j = i+1;
      var updatedActivities = [];
      for(var k=0; k < this.orderedActivities[day].length; k++){
        if(k==i){
          var updatedActivity = this.orderedActivities[day][j];
        }
        else if(k==j){
          var updatedActivity = this.orderedActivities[day][i];
        }
        else{
          var updatedActivity = this.orderedActivities[day][k];
        }
        updatedActivities.push(updatedActivity);
      }
      this.orderedActivities[day] = updatedActivities;
    }
    else{
      var lastActivity = this.orderedActivities[day].pop()
      this.orderedActivities[day+1].unshift(lastActivity);
    }
    this.myActivitiesService.setOrderedActivities(this.orderedActivities);
    this.postSchedule();
  }

  upArrowRequired(i:number, day:number){
    if(day==0){
      if(i==0){
        return false;
      }
    }
    return true;
  }

  downArrowRequired(i:number, day:number){
    if(day==4){
      if(i==this.orderedActivities[day].length-1){
        return false;
      }
    }
    return true;
  }

  getDrivingDistance(i:number, day:number){
    if(i==0){
      var label1 = 'origin';
    }
    else{
      var label1 = this.orderedActivities[day][i-1].id.toString() + '';
    }
    var label2 = this.orderedActivities[day][i].id.toString() + '';

    var distance = this.distanceMatrix[label1][label2];
    return Math.ceil(distance)    
  }

  getLastDistance(day:number){
    var idx = this.orderedActivities[day].length-1;
    var label = this.orderedActivities[day][idx].id.toString();
    var distance = this.distanceMatrix[label]['destination'];
    return Math.ceil(distance);
  }

  getTotalTime(day:number){
    var totalTime = this.getDrivingTime(day);
    for(var i=0; i<this.orderedActivities[day].length; i++){
      totalTime += this.orderedActivities[day][i].expectedDuration;
    }
    var totalHours = Math.round((totalTime/60)*10)/10;
    return totalHours;
  }

  getDrivingTime(day:number){
    var totalTime = 0;
    for(var i=0; i<this.orderedActivities[day].length; i++){
      totalTime += this.getDrivingDistance(i, day);
    }
    totalTime += this.getLastDistance(day);
    return totalTime;

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

  getSavedSchedule(userId: string){
    this.httpService.getSavedSchedule(userId)
      .subscribe(
        (data) => {
          // Set the distance matrix
          if('distanceMatrix' in data){
            let distanceMatrix = data['distanceMatrix'];
            this.distanceMatrix = distanceMatrix;
            this.myActivitiesService.setDistanceMatrix(distanceMatrix);
          }

          // Set the days
          if('days' in data){
            let days = data['days'];
            this.days = days;
            this.myActivitiesService.setDays(days);
          }

          // Set the schedule start
          if('scheduleStart' in data){
            let scheduleStart = this.objectToActivity(data['scheduleStart']);
            this.scheduleStart = scheduleStart;
            this.myActivitiesService.setScheduleStart(scheduleStart);
          }

          // Set the schedule end
          if('scheduleEnd' in data){
            let scheduleEnd = this.objectToActivity(data['scheduleEnd']);
            this.scheduleEnd = scheduleEnd;
            this.myActivitiesService.setScheduleEnd(scheduleEnd);
          }

          // Set the ordered activities
          if('orderedActivities' in data){
            var orderedActivities = {}
            for(var key in data['orderedActivities']){
              var activities = [];
              for(var i=0; i<data['orderedActivities'][key].length; i++){
                var activity = data['orderedActivities'][key][i];
                activities.push(this.objectToActivity(activity));
              }
              orderedActivities[key] = activities;
            }
            this.orderedActivities = orderedActivities;
            this.myActivitiesService.setOrderedActivities(orderedActivities);
          }
        },
        (error) => console.log(error)
    );
  }

  postSchedule(){
    var schedule = this.getScheduleObject();
    this.httpService.updateSavedSchedule(schedule, this.userId)
      .subscribe(
        (data) => console.log(data),
        (error) => console.log(error)
      );
  }

  getScheduleObject(){
    var schedule = {};
    schedule['userId'] = this.userId;
    schedule['dayMap'] = this.dayMap;
    schedule['days'] = this.days;
    schedule['distanceMatrix'] = this.distanceMatrix;
    schedule['scheduleStart'] = this.activityToObject(this.scheduleStart);
    schedule['scheduleEnd'] = this.activityToObject(this.scheduleEnd);
    var orderedActivities = {}
    for(var key in this.orderedActivities){
      var activities = [];
      for(var i=0; i<this.orderedActivities[key].length; i++){
        activities.push(this.activityToObject(this.orderedActivities[key][i]))
      }
      orderedActivities[key] = activities;
    }
    schedule['orderedActivities'] = orderedActivities;
    return schedule;
  }

  activityToObject(activity: Activity){
    let newActivity = {
      "id": activity.id,
      "caseName": activity.caseName,
      "activityType": activity.activityType,
      "expectedDuration": activity.expectedDuration,
      "address": activity.address,
      "city": activity.city,
      "state": activity.state,
      "zipCode": activity.zipCode,
      "coordinates": activity.coordinates,
      "completed":activity.completed 
    }
    return newActivity
  }

  objectToActivity(activity){
    let newActivity = new Activity(
      activity['id'],
      activity['caseName'],
      activity['activityType'],
      activity['expectedDuration'],
      activity['address'],
      activity['city'],
      activity['state'],
      activity['zipCode'],
      [activity['coordinates'][0], activity['coordinates'][1]],
      activity['completed']
    )
    return newActivity
  }

  formatAddress(activity: Activity){
    let address = [
      activity.address,
      activity.city,
      activity.state,
      activity.zipCode
    ].join(', ');
    return address
  }

  buildSchedule(){
    var schedule = {};
    for(var day in this.orderedActivities){
      if(this.orderedActivities[day].length>0){
        // Get the name of the day and total travel time
        let dayName = this.dayMap[day];
        let totalTime = this.getTotalTime(parseInt(day));
        schedule[dayName] = {'activities':[], 'totalTime': totalTime};

        // Find the start location
        let startAddress = this.formatAddress(this.scheduleStart);
        let start = {
          'activity' : 'start',
          'address': startAddress,
          'duration': null,
          'travel': null
        };
        schedule[dayName].activities.push(start);

        // Add the main activities
        for(var i=0; i<this.orderedActivities[day].length; i++){
          let activity = this.orderedActivities[day][i];
          let name = activity.caseName + ' ' + activity.activityType;
          let address = this.formatAddress(activity);
          let duration = activity.expectedDuration;
          let travel = this.getDrivingDistance(i, parseInt(day));
          let activityInfo = {
            'activity': name,
            'address': address,
            'duration': duration,
            'travel': travel
          };
          schedule[dayName].activities.push(activityInfo);
        }

        // Add the end location
        let endAddress = this.formatAddress(this.scheduleEnd);
        let travel = this.getLastDistance(parseInt(day));
        let end = {
          'activity': 'end',
          'address': endAddress,
          'duration': null,
          'travel': travel
        }
        schedule[dayName].activities.push(end);

      }
    }
    return schedule;
  }

 postMetrics(userId: string, action: string){
   this.httpService.postMetrics(userId, action)
     .subscribe(
        (data) => console.log(data),
        (error) => console.log(error)
    )
 }
}
