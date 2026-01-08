import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsistenciaEditarComponent } from './asistencia-editar.component';

describe('AsistenciaEditarComponent', () => {
  let component: AsistenciaEditarComponent;
  let fixture: ComponentFixture<AsistenciaEditarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistenciaEditarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsistenciaEditarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
