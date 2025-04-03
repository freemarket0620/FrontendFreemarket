import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarProductosEmpleadoComponent } from './listar-productos-empleado.component';

describe('ListarProductosEmpleadoComponent', () => {
  let component: ListarProductosEmpleadoComponent;
  let fixture: ComponentFixture<ListarProductosEmpleadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarProductosEmpleadoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarProductosEmpleadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
