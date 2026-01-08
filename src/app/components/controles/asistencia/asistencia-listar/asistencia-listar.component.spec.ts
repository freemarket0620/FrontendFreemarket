import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsistenciaListarComponent } from './asistencia-listar.component';

describe('AsistenciaListarComponent', () => {
  let component: AsistenciaListarComponent;
  let fixture: ComponentFixture<AsistenciaListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistenciaListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsistenciaListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
