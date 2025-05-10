import { TestBed } from '@angular/core/testing';

import { ImageFilesService } from './image-files.service';

describe('ImageFilesService', () => {
  let service: ImageFilesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageFilesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
