import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarUsuarioRolComponent } from './registrar-usuario-rol.component';

describe('RegistrarUsuarioRolComponent', () => {
  let component: RegistrarUsuarioRolComponent;
  let fixture: ComponentFixture<RegistrarUsuarioRolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarUsuarioRolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarUsuarioRolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
