import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { OptimizationProblem, Deadline } from '../shared/optimization-problem.model';
import { UserIdService } from '../services/user-id.service';
import { OptimizationService } from '../services/optimization.service';

@Component({
  selector: 'app-optimizer',
  templateUrl: './optimizer.component.html',
  styleUrls: ['./optimizer.component.css']
})
export class OptimizerComponent implements OnInit {
  activeTab: string;
  userId: string;
  deadlines: Deadline[];
  private sub: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private userIdService: UserIdService,
    private optimizationService: OptimizationService
  ) { }

  ngOnInit() {
    this.activeTab = 'schedule';
    
    this.sub = this.activatedRoute.params.subscribe(params =>{
      this.userId = params['userId'];
      this.userIdService.setUserId(this.userId);
    })

    this.deadlines = this.optimizationService.getDeadlines();
    this.optimizationService.problemChanged.subscribe(
      (problem: OptimizationProblem) => {
        this.deadlines = problem.deadlines;
      }
    )

  }

  checkDeadlines(){
    var deadlines = this.optimizationService.getDeadlines();
    return deadlines
  }

  onClick(tabName:string){
    this.activeTab = tabName;
  }

}
