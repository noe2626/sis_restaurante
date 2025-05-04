import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavCajaComponent } from './nav-caja.component';

describe('NavCajaComponent', () => {
  let component: NavCajaComponent;
  let fixture: ComponentFixture<NavCajaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NavCajaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavCajaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
