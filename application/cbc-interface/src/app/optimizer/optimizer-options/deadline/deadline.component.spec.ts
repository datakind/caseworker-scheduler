import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeadlineComponent } from './deadline.component';

describe('DeadlineComponent', () => {
  let component: DeadlineComponent;
  let fixture: ComponentFixture<DeadlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeadlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeadlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
