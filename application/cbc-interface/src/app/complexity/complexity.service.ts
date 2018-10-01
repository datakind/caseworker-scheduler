import { EventEmitter } from '@angular/core';

import { Case } from '../shared/case.model';
import { Subject } from 'rxjs/Subject';

export class ComplexityService {
  casesChanged = new EventEmitter<Case[]>();
  startedEditing = new Subject<number>();

}
