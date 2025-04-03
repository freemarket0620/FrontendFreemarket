import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarDetalleVentaComponent } from './registrar-detalle-venta.component';

describe('RegistrarDetalleVentaComponent', () => {
  let component: RegistrarDetalleVentaComponent;
  let fixture: ComponentFixture<RegistrarDetalleVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarDetalleVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarDetalleVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
