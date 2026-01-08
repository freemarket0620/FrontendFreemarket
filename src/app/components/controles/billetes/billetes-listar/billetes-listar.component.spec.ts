import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BilletesListarComponent } from './billetes-listar.component';

describe('BilletesListarComponent', () => {
  let component: BilletesListarComponent;
  let fixture: ComponentFixture<BilletesListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BilletesListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BilletesListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
