import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EjBarraComponent } from './ej-barra.component';

describe('EjBarraComponent', () => {
  let component: EjBarraComponent;
  let fixture: ComponentFixture<EjBarraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EjBarraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EjBarraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
