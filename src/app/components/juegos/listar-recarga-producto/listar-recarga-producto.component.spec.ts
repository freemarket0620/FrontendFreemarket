import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarRecargaProductoComponent } from './listar-recarga-producto.component';

describe('ListarRecargaProductoComponent', () => {
  let component: ListarRecargaProductoComponent;
  let fixture: ComponentFixture<ListarRecargaProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarRecargaProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarRecargaProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
