import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StartpointComponent } from './startpoint.component';

describe('StartpointComponent', () => {
  let component: StartpointComponent;
  let fixture: ComponentFixture<StartpointComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StartpointComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartpointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
