import { Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-optimizer-options',
  templateUrl: './optimizer-options.component.html',
  styleUrls: ['./optimizer-options.component.css']
})
export class OptimizerOptionsComponent implements OnInit {
  option: string;
  
  constructor() {}

  ngOnInit() {
    this.option = 'order';
  }

  onClick(tabName:string){
    this.option = tabName;
  }
}