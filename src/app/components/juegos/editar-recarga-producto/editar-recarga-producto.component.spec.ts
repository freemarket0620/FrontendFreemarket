import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarRecargaProductoComponent } from './editar-recarga-producto.component';

describe('EditarRecargaProductoComponent', () => {
  let component: EditarRecargaProductoComponent;
  let fixture: ComponentFixture<EditarRecargaProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarRecargaProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarRecargaProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
