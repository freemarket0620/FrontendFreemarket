import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonedasCrearComponent } from './monedas-crear.component';

describe('MonedasCrearComponent', () => {
  let component: MonedasCrearComponent;
  let fixture: ComponentFixture<MonedasCrearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonedasCrearComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonedasCrearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
