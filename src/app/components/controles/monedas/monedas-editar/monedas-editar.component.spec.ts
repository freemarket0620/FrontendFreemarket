import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonedasEditarComponent } from './monedas-editar.component';

describe('MonedasEditarComponent', () => {
  let component: MonedasEditarComponent;
  let fixture: ComponentFixture<MonedasEditarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonedasEditarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonedasEditarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
