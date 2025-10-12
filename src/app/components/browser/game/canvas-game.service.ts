import { Injectable } from '@angular/core';

@Injectable()
// {providedIn: 'root'}
export class CanvasGameService {
  constructor() {}
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  img!: HTMLImageElement;
  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }
  setImage(image_src: string) {
    return new Promise((resolve, reject) => {
      this.img = new Image();
      this.img.src = 'pricol/' + image_src;
      this.img.onload = () => {
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        resolve(true);
      };
    });
  }
}
