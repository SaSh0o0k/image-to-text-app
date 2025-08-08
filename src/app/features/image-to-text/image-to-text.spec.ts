import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageToText } from './image-to-text';

describe('ImageToText', () => {
  let component: ImageToText;
  let fixture: ComponentFixture<ImageToText>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageToText]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageToText);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
