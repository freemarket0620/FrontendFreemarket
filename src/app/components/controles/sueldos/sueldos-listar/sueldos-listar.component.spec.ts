import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SueldosListarComponent } from './sueldos-listar.component';

describe('SueldosListarComponent', () => {
  let component: SueldosListarComponent;
  let fixture: ComponentFixture<SueldosListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SueldosListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SueldosListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
