import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyActivitiesEditComponent } from './my-activities-edit.component';

describe('MyActivitiesEditComponent', () => {
  let component: MyActivitiesEditComponent;
  let fixture: ComponentFixture<MyActivitiesEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyActivitiesEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyActivitiesEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
