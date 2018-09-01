import { EventEmitter } from '@angular/core';

import { Subject } from 'rxjs/Subject';

export class ObjectiveService {
  private objective: string = 'Minimize Driving Time'

  getObjective() {
    return this.objective;
  }

  updateObjective(objective: string){
    this.objective = objective
  }

}