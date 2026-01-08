import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarDetalleVentaRecargaComponent } from './listar-detalle-venta-recarga.component';

describe('ListarDetalleVentaRecargaComponent', () => {
  let component: ListarDetalleVentaRecargaComponent;
  let fixture: ComponentFixture<ListarDetalleVentaRecargaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarDetalleVentaRecargaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarDetalleVentaRecargaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
