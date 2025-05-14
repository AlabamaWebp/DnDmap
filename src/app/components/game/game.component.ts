import { Router } from '@angular/router';
import { ElectronService } from '../../shared/services/electron.service';
import { ImageFilesService } from '../../shared/services/image-files.service';
import { tymanRect } from '../card-creator/card-creator.component';
import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { options } from '../../isgame';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent {
  gridSize = 80; // Размер сетки по умолчанию
  lineWidth = 1; // Ширина линий по умолчанию
  x = 0.5;
  y = 0.5;
  width1 = document.documentElement.clientWidth - 300;
  height1 = document.documentElement.clientHeight;
  canvas!: HTMLCanvasElement;
  // ctx!: CanvasRenderingContext2D;
  img!: HTMLImageElement;
  clickedX = 0;
  clickedY = 0;
  isClicked = false;
  isMoved = false;
  size = 5;
  type: 'Сетка' | 'Туман' = 'Туман';
  tyman: tymanRect[] = [];
  current_tyman?: tymanRect;
  tmp_tyman?: tymanRect;
  color_of_tyman = 'rgb(0 0 0 / 50%)';
  old_data?: any;
  scale!: number;
  version = 1;
  timeout?: any;
  get ctx() {
    return this.canvas.getContext('2d')!;
  }

  constructor(
    private elec: ElectronService,
    private files: ImageFilesService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }
  runWithTimeout(func: () => void) {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(func, 200);
  }

  canvClick(event: MouseEvent) {
    if (event.button === 0) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.clickedX = x;
      this.clickedY = y;
      this.isClicked = true;
    }
  }
  @HostListener('document:mouseup')
  canvUnclick() {
    if (
      this.type == 'Туман' &&
      this.isClicked &&
      this.isMoved &&
      this.tmp_tyman
    ) {
      this.tyman.push(this.tmp_tyman!);
    }
    this.clickedX = -1;
    this.clickedY = -1;
    this.isClicked = false;
    this.tmp_tyman = undefined;
  }
  canvMove(event: MouseEvent) {
    if (this.isClicked) {
      this.isMoved = true;
      const rect = this.canvas.getBoundingClientRect();
      const x = event.x - rect.left;
      const y = event.clientY - rect.top;
      this.drawGrid();
    }
  }


  @HostListener('window:resize')
  resize() {
    this.runWithTimeout(() => {
      const old_scale = this.scale;
      if (this.img)
        this.scale = Math.max(
          (document.documentElement.clientWidth) / this.img.width,
          document.documentElement.clientHeight / this.img.height
        );
      this.canvas = document.querySelector('#canvas1') as HTMLCanvasElement;
      this.doScale(old_scale);
      setTimeout(() => {
        this.drawGrid();
      }, 1);
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    this.canvas = document.querySelector('#canvas1') as HTMLCanvasElement;
    // this.ctx = this.canvas.getContext('2d')!;
    this.files.getFolder(options.company)
    this.loadJson();
    this.canvasInit();
  }

  canvasInit() {
    // const test = this.elec.fs.readFileSync("")
    this.img = new Image();
    this.img.src =
      'file://' + this.files.path + options.company + "/" + this.files.images[0]; // Путь по умолчанию
    // this.name = this.files.images[0].split('.').slice(0, -1).join('.');
    this.img.onload = () => {
      // this.width = this.canvas.clientWidth;
      // this.height = this.canvas.clientHeight;
      const old_scale = this.scale;
      this.resize();
      if (this.old_data) this.doScale(old_scale);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
      this.cdr.detectChanges();

      this.drawGrid(); // Рисуем сетку
    };
  }

  loadJson() {
    if (!this.old_data)
      this.old_data = JSON.parse(
        this.elec.fs
          .readFileSync(this.files.path + options.company + "/" + this.files.images[0] + ".json")
          .toString()
      );
    const data = this.old_data;
    // const vars = ['gridSize', 'lineWidth', 'x', 'y', 'width1', 'height1', 'size'];
    if (data.version != this.version) return;
    const vars = ['gridSize', 'lineWidth', 'x', 'y', 'size', 'tyman', 'scale'];
    //TODO
    const t: any = this;
    for (const e of vars) {
      t[e] = data[e];
    }
  }

  doScale(old_scale: number) {
    const t: any = this;
    const scale = 1 + ((this.scale - old_scale) / old_scale);

    const scalable = ['gridSize', 'x', 'y'];
    scalable.forEach((e) => {
      t[e] = Math.abs(t[e] * scale);
    });
    const tyman_: ('h' | 'w' | 'x' | 'y')[] = ['h', 'w', 'x', 'y'];
    this.tyman = this.tyman.map((e) => {
      tyman_.forEach((k) => {
        e[k] = e[k] * scale;
      });
      return e;
    });
  }

  drawGrid() {
    this.width1 = this.img.width * this.scale;
    this.height1 = this.img.height * this.scale;
    this.cdr.detectChanges();
    this.ctx.clearRect(0, 0, this.width1, this.height1); // Очистка this.canvas
    this.ctx.drawImage(this.img, 0, 0, this.width1, this.height1);

    this.ctx.strokeStyle = 'rgba(0,0,0,0.8)'; // Цвет и прозрачность линий
    this.ctx.lineWidth = this.lineWidth;
    // Рисуем вертикальные линии
    for (let x = this.x; x < this.width1; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height1);
      this.ctx.stroke();
    }
    // Рисуем горизонтальные линии
    for (let y = this.y; y < this.height1; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width1, y);
      this.ctx.stroke();
    }
    this.tyman.forEach((e) => {
      if (e == this.current_tyman)
        this.createRect(e, 'rgb(100, 100, 100, 80%)');
      else this.createRect(e);
    });
    this.createRect();
  }

  createRect(
    rect: tymanRect = this.tmp_tyman!,
    color: string = this.color_of_tyman
  ) {
    if (!rect) return;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
}

