import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BilletesCrearComponent } from './billetes-crear.component';

describe('BilletesCrearComponent', () => {
  let component: BilletesCrearComponent;
  let fixture: ComponentFixture<BilletesCrearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BilletesCrearComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BilletesCrearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
