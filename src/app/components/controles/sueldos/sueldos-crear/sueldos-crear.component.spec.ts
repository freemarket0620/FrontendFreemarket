import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SueldosCrearComponent } from './sueldos-crear.component';

describe('SueldosCrearComponent', () => {
  let component: SueldosCrearComponent;
  let fixture: ComponentFixture<SueldosCrearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SueldosCrearComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SueldosCrearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
