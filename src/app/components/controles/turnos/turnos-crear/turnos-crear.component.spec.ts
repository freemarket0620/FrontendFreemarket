import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosCrearComponent } from './turnos-crear.component';

describe('TurnosCrearComponent', () => {
  let component: TurnosCrearComponent;
  let fixture: ComponentFixture<TurnosCrearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosCrearComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnosCrearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
