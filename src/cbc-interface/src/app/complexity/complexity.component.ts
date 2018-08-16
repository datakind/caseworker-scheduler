import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

import { Case } from '../shared/case.model';
import { ComplexityService } from './complexity.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-complexity',
  templateUrl: './complexity.component.html',
  styleUrls: ['./complexity.component.css']
})
export class ComplexityComponent implements OnInit {
  @ViewChild('f') slForm: NgForm;
  subscription: Subscription;

  constructor() { }

  ngOnInit() {
  }

  onSubmit(form: NgForm){
  }

  onClear(){
    this.slForm.reset();
  }
}
