import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarDetalleVentaRecargaComponent } from './editar-detalle-venta-recarga.component';

describe('EditarDetalleVentaRecargaComponent', () => {
  let component: EditarDetalleVentaRecargaComponent;
  let fixture: ComponentFixture<EditarDetalleVentaRecargaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarDetalleVentaRecargaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarDetalleVentaRecargaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
