import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EfectivoListarComponent } from './efectivo-listar.component';

describe('EfectivoListarComponent', () => {
  let component: EfectivoListarComponent;
  let fixture: ComponentFixture<EfectivoListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EfectivoListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EfectivoListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
