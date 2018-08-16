import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OptimizerOptionsComponent } from './optimizer-options.component';

describe('OptimizerOptionsComponent', () => {
  let component: OptimizerOptionsComponent;
  let fixture: ComponentFixture<OptimizerOptionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OptimizerOptionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OptimizerOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
