import { Injectable } from '@angular/core';
import { Headers, Http, Response, URLSearchParams } from '@angular/http';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Observable';

import { Activity } from '../shared/activity.model';
import { MyActivitiesService } from './my-activities.service';
import { OptimizationService } from './optimization.service';

declare function require(name:string);
const config = require('../shared/config.json');
let BASE_URL = config.url;

@Injectable()
export class ActivityRouterService {

  constructor(
    private http: Http,
    private myActivitiesService: MyActivitiesService,
    private optimizationService: OptimizationService
  ) {}

  buildPostBody(){
    // Build the format for the post body
    var start = this.myActivitiesService.getStart();
    var end = this.myActivitiesService.getEnd();
    var postBody = {
      "origin" : {
        "label" : "home",
        "coordinates" : [
          start.coordinates[0].toString(),
          start.coordinates[1].toString()
        ]
      },
      "destination" : {
        "label" : "destination",
        "coordinates" : [
          end.coordinates[0].toString(),
          end.coordinates[1].toString()
        ]
      },
      "activities" : []
    }

    // Build the required elements for the optimization problem
    //const activities = this.myActivitiesService.getToDoActivities();
    const activities = this.myActivitiesService.getActivities();
    var indexMapping = {};
    for(var i = 0; i < activities.length; i++){
      var activity = activities[i];
      var coordinates = [
        activity.coordinates[0].toString(),
        activity.coordinates[1].toString()
      ]
      var label = activity.id.toString();
      var address = [
        activity.address,
        activity.city,
        activity.state,
        activity.zipCode
      ].join(", ");
      var name = [activity.caseName, activity.activityType].join(" ");
      postBody.activities.push({
        "coordinates" : coordinates,
        "label" : label,
        "duration" : activity.expectedDuration,
        "address" : address,
        "name" : name
      })
      // The index mapping is used to construct the constraints
      // since it works based on index rather than id
      indexMapping[activity.id] = i;
    }

    // If necessary, add constraints to the optimization problem
    const constraints = this.optimizationService.getConstraints();
    if(constraints.length > 0){
      var problemConstraints = [];
      for(var i = 0; i < constraints.length; i++){
        var constraint = constraints[i];
        // Find the first index
        var activity1 = constraint.firstActivity;
        var id1 = this.myActivitiesService.getActivityId(activity1);
        var index1 = indexMapping[id1];
        // Find the second index
        var activity2 = constraint.secondActivity;
        var id2 = this.myActivitiesService.getActivityId(activity2);
        var index2 = indexMapping[id2];
        problemConstraints.push({
          "activity1" : id1,
          "constraint_type" : constraint.order,
          "activity2" : id2
        })       
      }
      postBody['constraints'] = problemConstraints;

    }

    // Add the number of days available
    const days = this.optimizationService.getHours();
    postBody['days'] = days;

    // If necessary, add day assignments to the problem
    var assignments = this.optimizationService.getDeadlines();
    var dayAssignments = {};
    for(var i = 0; i < assignments.length; i++){
      var assignedActivity = assignments[i].activity;
      var assignedId = this.myActivitiesService
                           .getActivityId(assignedActivity)
                           .toString();
      var assignedDay = assignments[i].dueDate
                                      .toLowerCase();
      dayAssignments[assignedId] = assignedDay;
    }
    postBody['day_assignments'] = dayAssignments;

    // If necessary, add groupings to the problem
    var groupings = this.optimizationService.getGroups();
    var groups = [];
    for(var i=0; i < groupings.length; i++){
      var ID1 = this.myActivitiesService
                    .getActivityId(groupings[i].activity1)
                    .toString();
      var ID2 = this.myActivitiesService
                    .getActivityId(groupings[i].activity2)
                    .toString();
      var group = [ID1, ID2];
      groups.push(group);
    }
    postBody['groups'] = groups;
    
    console.log(postBody);
    return postBody
  }

  buildSchedule(){
    let url = BASE_URL + '/cbc_datakind/api/v1.0/schedule';
    let postBody = this.buildPostBody();
    return this.http.post(url, postBody)
      .map(
        (response: Response) => {
          const data = response.json();
          return data
        }
      )
      .catch(
        (error: Response) => {
          return Observable.throw('Something went wrong');
        }
      );
  }  
}
