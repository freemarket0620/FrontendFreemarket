import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonedasListarComponent } from './monedas-listar.component';

describe('MonedasListarComponent', () => {
  let component: MonedasListarComponent;
  let fixture: ComponentFixture<MonedasListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonedasListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonedasListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
