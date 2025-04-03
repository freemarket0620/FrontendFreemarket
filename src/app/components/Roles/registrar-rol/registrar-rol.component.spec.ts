import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarRolComponent } from './registrar-rol.component';

describe('RegistrarRolComponent', () => {
  let component: RegistrarRolComponent;
  let fixture: ComponentFixture<RegistrarRolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarRolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarRolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
