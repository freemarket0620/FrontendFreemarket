import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarRecargaProductoComponent } from './registrar-recarga-producto.component';

describe('RegistrarRecargaProductoComponent', () => {
  let component: RegistrarRecargaProductoComponent;
  let fixture: ComponentFixture<RegistrarRecargaProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarRecargaProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarRecargaProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
