import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SueldosEditarComponent } from './sueldos-editar.component';

describe('SueldosEditarComponent', () => {
  let component: SueldosEditarComponent;
  let fixture: ComponentFixture<SueldosEditarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SueldosEditarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SueldosEditarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
