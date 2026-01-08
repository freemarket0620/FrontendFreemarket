import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosListarComponent } from './turnos-listar.component';

describe('TurnosListarComponent', () => {
  let component: TurnosListarComponent;
  let fixture: ComponentFixture<TurnosListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnosListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
