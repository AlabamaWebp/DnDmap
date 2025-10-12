import { Injectable } from '@angular/core';
import { tymanRect } from '../../electron/card-creator/card-creator.component';
import { figure_coord } from './game.component';

@Injectable()
// {providedIn: 'root'}
export class CanvasGameService {
  line_width = 1; // Ширина линий по умолчанию
  cell_size = 5;
  private readonly grid_color = 'rgba(0,0,0,0.8)';
  constructor() {}
  private canvas_!: HTMLCanvasElement;
  private ctx_!: CanvasRenderingContext2D;
  get canvas() {
    return this.canvas_;
  }
  get ctx() {
    return this.ctx_;
  }
  img!: HTMLImageElement;
  params: ICanvasParams = {
    grid: {
      offset: {
        x: -1,
        y: -1,
      },
      grid_size: 80,
    },
    size: {
      x: -1,
      y: -1,
    },
  };

  init(canvas: HTMLCanvasElement) {
    this.canvas_ = canvas;
    this.ctx_ = canvas.getContext('2d')!;
  }
  newImage(image_src: string) {
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
  drawGrid() {
    this.ctx.strokeStyle = this.grid_color; // Цвет и прозрачность линий
    this.ctx.lineWidth = this.line_width;
    // Рисуем вертикальные линии
    for (
      let x = this.params.grid.offset.x;
      x < this.params.size.x;
      x += this.params.grid.grid_size
    ) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.params.size.y);
      this.ctx.stroke();
    }
    // Рисуем горизонтальные линии
    for (
      let y = this.params.grid.offset.y;
      y < this.params.size.y;
      y += this.params.grid.grid_size
    ) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.params.size.x, y);
      this.ctx.stroke();
    }
  }
  clear() {
    this.ctx.clearRect(0, 0, this.params.size.x, this.params.size.y); // Очистка this.canvas
  }
  drawImage() {
    this.ctx.drawImage(this.img, 0, 0, this.params.size.x, this.params.size.y);
  }
  drawFilledRect(rect: tymanRect, color?: string) {
    this.ctx.fillStyle = color ?? 'white';
    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  drawText(text: string, x: number, y: number) {
    this.ctx.font = '25px Arial';
    this.ctx.strokeStyle = 'black';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.strokeText(text, x, y);
    this.ctx.fillText(text, x, y);
  }
  drawFishka(d: ICoords, color: string, border_color: string) {
    if (!d || !color) return;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(
      d.x,
      d.y,
      this.params.grid.grid_size / 2,
      0,
      2 * Math.PI,
      false
    );
    this.ctx.fill();
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = border_color;
    this.ctx.stroke();
  }
  drawConusEdge(f: IVector2d) {
    if (f.to) {
      const A = f.from;
      const B = f.to;
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      const angle = (22.5 * Math.PI) / 180;
      const cos = Math.cos(-angle);
      const sin = Math.sin(-angle);
      const dx2 = dx * cos - dy * sin;
      const dy2 = dx * sin + dy * cos;
      const C = { x: A.x + dx2, y: A.y + dy2 };
      const cos2 = Math.cos(angle);
      const sin2 = Math.sin(angle);
      const dx3 = dx * cos2 - dy * sin2;
      const dy3 = dx * sin2 + dy * cos2;
      const D = { x: A.x + dx3, y: A.y + dy3 };
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 3;
      this.conusHelper(A, B, C);
      this.conusHelper(A, B, D);

      const midX = (A.x + B.x) / 2;
      const midY = (A.y + B.y) / 2;
      this.drawText(len + '', midX, midY);
    }
  }
  private conusHelper(a: ICoords, b: ICoords, c: ICoords) {
    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.lineTo(c.x, c.y);
    this.ctx.closePath();
    this.ctx.stroke();
  }
  drawCircleEdge(f: IVector2d) {
    const center = f.from;
    const edge = f.to;

    const radius = Math.sqrt(
      Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
    );

    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(center.x, center.y);
    this.ctx.lineTo(edge.x, edge.y);
    this.ctx.stroke();

    const midX = (center.x + edge.x) / 2;
    const midY = (center.y + edge.y) / 2;
    this.drawText(radius + '', midX, midY);
  }
  drawRectangleEdge(f: IVector2d) {
    const center = f.from;
    const poc = f.to;
    const sideLength = Math.max(
      Math.abs(center.x - poc.x),
      Math.abs(center.y - poc.y)
    );
    const topLeft = {
      x: center.x - sideLength,
      y: center.y - sideLength,
    };
    const side = sideLength * 2;
    this.ctx.beginPath();
    this.ctx.rect(topLeft.x, topLeft.y, side, side);
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(center.x, center.y);
    this.ctx.lineTo(poc.x, poc.y);
    this.ctx.stroke();
    const midX = (center.x + poc.x) / 2;
    const midY = (center.y + poc.y) / 2;
    this.drawText(sideLength + '', midX, midY);
  }
  drawDot(A: ICoords) {
    this.ctx.fillStyle = 'red';
    this.ctx.beginPath();
    this.ctx.arc(A.x, A.y, 5, 0, 2 * Math.PI);
    this.ctx.fill();
  }
}
export interface IVector2d {
  from: ICoords;
  to: ICoords;
}

export interface ICanvasParams {
  size: ICoords;
  grid: IGridParameters;
}
export interface IGridParameters {
  offset: ICoords;
  grid_size: number;
}
export interface ICoords {
  x: number;
  y: number;
}
