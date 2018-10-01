import { EventEmitter } from '@angular/core';

import { 
  OptimizationProblem, 
  OrderConstraint,
  Deadline,
  Group 
} from '../shared/optimization-problem.model';

import { Subject } from 'rxjs/Subject';

export class OptimizationService {
  problemChanged = new EventEmitter<OptimizationProblem>();
  startedEditing = new Subject<number>();
  private optimizationProblem: OptimizationProblem =  
      new OptimizationProblem(
        'Minimize Driving Time',
        {
          'monday': 8,
          'tuesday': 8,
          'wednesday': 0,
          'thursday' : 0,
          'friday' : 0
        },
        [],
        [],
        []
      );

  getProblem() {
    return this.optimizationProblem;
  }

  updateProblem(updatedProblem: OptimizationProblem){
    this.optimizationProblem = updatedProblem;
    this.problemChanged.next(this.optimizationProblem);
  }

  updateObjective(objective: string){
    this.optimizationProblem.objective = objective;
  }

  updateHours(hours: object){
    this.optimizationProblem.hours = hours;
  }

  getConstraint(index: number){
    return this.optimizationProblem.constraints[index];
  }

  getConstraints(){
    return this.optimizationProblem.constraints.slice();
  }

  addConstraint(newConstraint: OrderConstraint){
    this.optimizationProblem.constraints.push(newConstraint);
    this.problemChanged.next(this.optimizationProblem);  
  }

  updateConstraint(index: number, newConstraint: OrderConstraint){
    this.optimizationProblem.constraints[index] = newConstraint;
    this.problemChanged.next(this.optimizationProblem);  
  }

  deleteConstraint(index: number){
    this.optimizationProblem.constraints.splice(index,1);
    this.problemChanged.next(this.optimizationProblem);  
  }

  setConstraints(constraints: OrderConstraint[]){
    this.optimizationProblem.constraints = constraints;
  }

  getDeadline(index: number){
    return this.optimizationProblem.deadlines[index];
  }

  getDeadlines(){
    return this.optimizationProblem.deadlines.slice();
  }

  addDeadline(newDeadline: Deadline){
    this.optimizationProblem.deadlines.push(newDeadline);
    this.problemChanged.next(this.optimizationProblem);
  }

  updateDeadline(index: number, newDeadline: Deadline){
    this.optimizationProblem.deadlines[index] = newDeadline;
    this.problemChanged.next(this.optimizationProblem);
  }

  deleteDeadline(index: number){
    this.optimizationProblem.deadlines.splice(index,1);
    this.problemChanged.next(this.optimizationProblem);
  }

  setDeadlines(deadlines: Deadline[]){
    this.optimizationProblem.deadlines = deadlines;
  }

  getGroup(index: number){
    return this.optimizationProblem.groups[index];
  }

  getGroups(){
    return this.optimizationProblem.groups.slice();
  }

  addGroup(newGroup: Group){
    this.optimizationProblem.groups.push(newGroup);
    this.problemChanged.next(this.optimizationProblem);
  }

  updateGroup(index: number, newGroup: Group){
    this.optimizationProblem.groups[index] = newGroup;
    this.problemChanged.next(this.optimizationProblem);
  }

  deleteGroup(index: number){
    this.optimizationProblem.groups.splice(index,1);
    this.problemChanged.next(this.optimizationProblem);
  }

  getHours(){
    return this.optimizationProblem.hours;
  }

}
