import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecargamaxComponent } from './recargamax.component';

describe('RecargamaxComponent', () => {
  let component: RecargamaxComponent;
  let fixture: ComponentFixture<RecargamaxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecargamaxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecargamaxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
