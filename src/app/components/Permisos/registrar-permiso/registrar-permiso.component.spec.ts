import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarPermisoComponent } from './registrar-permiso.component';

describe('RegistrarPermisoComponent', () => {
  let component: RegistrarPermisoComponent;
  let fixture: ComponentFixture<RegistrarPermisoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarPermisoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarPermisoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
