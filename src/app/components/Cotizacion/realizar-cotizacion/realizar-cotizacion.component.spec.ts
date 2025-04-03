import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealizarCotizacionComponent } from './realizar-cotizacion.component';

describe('RealizarCotizacionComponent', () => {
  let component: RealizarCotizacionComponent;
  let fixture: ComponentFixture<RealizarCotizacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealizarCotizacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RealizarCotizacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
