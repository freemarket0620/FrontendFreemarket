import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsistenciaCrearComponent } from './asistencia-crear.component';

describe('AsistenciaCrearComponent', () => {
  let component: AsistenciaCrearComponent;
  let fixture: ComponentFixture<AsistenciaCrearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistenciaCrearComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsistenciaCrearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
