import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyActivitiesComponent } from './my-activities.component';

describe('MyActivitiesComponent', () => {
  let component: MyActivitiesComponent;
  let fixture: ComponentFixture<MyActivitiesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyActivitiesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
