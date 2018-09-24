import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

import { OptimizationProblem } from '../../../shared/optimization-problem.model';
import { OptimizationService } from '../../../services/optimization.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-hours',
  templateUrl: './hours.component.html',
  styleUrls: ['./hours.component.css']
})
export class HoursComponent implements OnInit, OnDestroy {
  @ViewChild('f') slForm: NgForm;
  subscription: Subscription;
  problem: OptimizationProblem;

  constructor(private optimizationService: OptimizationService) { }

  ngOnInit() { 
     this.problem = this.optimizationService.getProblem();
     this.subscription = this.optimizationService.startedEditing
      .subscribe(
        () => {
          this.problem = this.optimizationService.getProblem();
          this.slForm.setValue({
            monday: this.problem.hours['monday'],
            tuesday: this.problem.hours['tuesday'],
            wednesday: this.problem.hours['wednesday'],
            thursday: this.problem.hours['thursday'],
            friday: this.problem.hours['friday']
          })
        }
      );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onReset(){
    this.slForm.setValue({
          monday: this.problem.hours['monday'],
          tuesday: this.problem.hours['tuesday'],
          wednesday: this.problem.hours['wednesday'],
          thursday: this.problem.hours['thursday'],
          friday: this.problem.hours['friday']
    })
  }

  onUpdate(form: NgForm){
    const value = form.value;
    const hours = {
      'monday' : value.monday,
      'tuesday' : value.tuesday,
      'wednesday' : value.wednesday,
      'thursday' : value.thursday,
      'friday' : value.friday
    }
    this.optimizationService.updateHours(hours);

    // Delete constraints for any day where the 
    // hours available is zero
    var updatedDeadlines = [];
    for(var i=0; i<this.problem.deadlines.length; i++){
      let deadline = this.problem.deadlines[i];
      let day = deadline.dueDate.toLowerCase();
      let activity = deadline.activity;
      var dropActivities = [];
      if(this.problem.hours[day] > 0){
        updatedDeadlines.push(deadline)
      }
      else{
        dropActivities.push(activity);
      }
    }
    this.optimizationService.setDeadlines(updatedDeadlines);

    // Delete order constrains on days that were deleted
    var updatedConstraints = [];
    for(var i=0; i<this.problem.constraints.length; i++){
      let constraint = this.problem.constraints[i];
      if(dropActivities.indexOf(constraint.firstActivity)===-1){
        if(dropActivities.indexOf(constraint.secondActivity)===-1){
          updatedConstraints.push(constraint);
        }
      }
    }
    this.optimizationService.setConstraints(updatedConstraints);
  }

}
