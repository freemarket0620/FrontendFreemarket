import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BilletesEditarComponent } from './billetes-editar.component';

describe('BilletesEditarComponent', () => {
  let component: BilletesEditarComponent;
  let fixture: ComponentFixture<BilletesEditarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BilletesEditarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BilletesEditarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
