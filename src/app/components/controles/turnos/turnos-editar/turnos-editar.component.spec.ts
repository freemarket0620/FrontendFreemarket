import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosEditarComponent } from './turnos-editar.component';

describe('TurnosEditarComponent', () => {
  let component: TurnosEditarComponent;
  let fixture: ComponentFixture<TurnosEditarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosEditarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnosEditarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
