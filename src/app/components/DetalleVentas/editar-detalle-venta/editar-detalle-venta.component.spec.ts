import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarDetalleVentaComponent } from './editar-detalle-venta.component';

describe('EditarDetalleVentaComponent', () => {
  let component: EditarDetalleVentaComponent;
  let fixture: ComponentFixture<EditarDetalleVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarDetalleVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarDetalleVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
