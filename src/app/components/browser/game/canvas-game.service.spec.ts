import { TestBed } from '@angular/core/testing';

import { CanvasGameService } from './canvas-game.service';

describe('CanvasGameService', () => {
  let service: CanvasGameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
