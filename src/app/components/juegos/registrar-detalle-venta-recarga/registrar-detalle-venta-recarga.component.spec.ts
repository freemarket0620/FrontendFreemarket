import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarDetalleVentaRecargaComponent } from './registrar-detalle-venta-recarga.component';

describe('RegistrarDetalleVentaRecargaComponent', () => {
  let component: RegistrarDetalleVentaRecargaComponent;
  let fixture: ComponentFixture<RegistrarDetalleVentaRecargaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarDetalleVentaRecargaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarDetalleVentaRecargaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
