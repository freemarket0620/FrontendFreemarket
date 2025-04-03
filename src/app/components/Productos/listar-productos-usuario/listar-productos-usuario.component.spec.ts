import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarProductosUsuarioComponent } from './listar-productos-usuario.component';

describe('ListarProductosUsuarioComponent', () => {
  let component: ListarProductosUsuarioComponent;
  let fixture: ComponentFixture<ListarProductosUsuarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarProductosUsuarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarProductosUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
