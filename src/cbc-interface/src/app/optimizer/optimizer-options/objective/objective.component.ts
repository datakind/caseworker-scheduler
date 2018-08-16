import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

import { OptimizationProblem } from '../../../shared/optimization-problem.model';
import { OptimizationService } from '../../../services/optimization.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-objective',
  templateUrl: './objective.component.html',
  styleUrls: ['./objective.component.css']
})
export class ObjectiveComponent implements OnInit, OnDestroy {
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
            objective: this.problem.objective
          })
        }
      );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onClear(){
    this.slForm.reset();
  }

  onSet(form: NgForm){
    const value = form.value;
    this.optimizationService.updateObjective(value.objective);
  }

}
