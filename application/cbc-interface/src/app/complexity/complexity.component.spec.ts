import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplexityComponent } from './complexity.component';

describe('ComplexityComponent', () => {
  let component: ComplexityComponent;
  let fixture: ComponentFixture<ComplexityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ComplexityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplexityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
