import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCreatorComponent } from './card-creator.component';

describe('CardCreatorComponent', () => {
  let component: CardCreatorComponent;
  let fixture: ComponentFixture<CardCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardCreatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
