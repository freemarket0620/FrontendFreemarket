import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EfectivoCrearComponent } from './efectivo-crear.component';

describe('EfectivoCrearComponent', () => {
  let component: EfectivoCrearComponent;
  let fixture: ComponentFixture<EfectivoCrearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EfectivoCrearComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EfectivoCrearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
