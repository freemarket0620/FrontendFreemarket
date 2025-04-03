import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarRolPermisoComponent } from './registrar-rol-permiso.component';

describe('RegistrarRolPermisoComponent', () => {
  let component: RegistrarRolPermisoComponent;
  let fixture: ComponentFixture<RegistrarRolPermisoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarRolPermisoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarRolPermisoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
