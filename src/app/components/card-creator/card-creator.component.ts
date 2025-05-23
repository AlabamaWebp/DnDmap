import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import { ElectronService } from '../../shared/services/electron.service';
import { ImageFilesService } from '../../shared/services/image-files.service';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Router } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  standalone: true,
  selector: 'app-card-creator',
  imports: [
    MatSliderModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatCheckboxModule,
  ],
  templateUrl: './card-creator.component.html',
  styleUrl: './card-creator.component.scss',
})
export class CardCreatorComponent implements OnInit {
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
  name!: string;
  type: 'Сетка' | 'Туман' = 'Сетка';
  tyman: tymanRect[] = [];
  current_tyman?: tymanRect;
  tmp_tyman?: tymanRect;
  color_of_tyman = 'rgb(0 0 0 / 50%)';
  old_data?: any;
  scale!: number;
  version = 1;
  grid = true;
  get ctx() {
    return this.canvas.getContext('2d')!;
  }

  timeout?: any;
  runWithTimeout(func: () => void) {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(func, 200);
  }

  constructor(
    private elec: ElectronService,
    private files: ImageFilesService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.canvas = document.querySelector('#canvas1') as HTMLCanvasElement;
    // this.ctx = this.canvas.getContext('2d')!;
    this.loadJson();
    this.canvasInit();
  }

  loadJson() {
    if (
      !this.elec.fs.existsSync(
        this.files.path +
          this.files.c_comp +
          '/' +
          this.files.c_location +
          '.json'
      )
    )
      return;
    if (!this.old_data)
      this.old_data = JSON.parse(
        this.elec.fs
          .readFileSync(
            this.files.path +
              this.files.c_comp +
              '/' +
              this.files.c_location +
              '.json'
          )
          .toString()
      );
    const data = this.old_data;
    // const vars = ['gridSize', 'lineWidth', 'x', 'y', 'width1', 'height1', 'size'];
    if (data.version != this.version) return;
    const vars = ['gridSize', 'lineWidth', 'x', 'y', 'size', 'tyman', 'scale', "grid"];
    const t: any = this;
    for (const e of vars) {
      t[e] = data[e];
    }
  }

  doScale(old_scale: number) {
    const t: any = this;
    const scale = 1 + (this.scale - old_scale) / old_scale;
    if (Number.isNaN(scale)) return;
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

  canvasInit() {
    // const test = this.elec.fs.readFileSync("")
    this.img = new Image();
    this.img.src =
      'file://' +
      this.files.path +
      this.files.c_comp +
      '/' +
      this.files.c_location; // Путь по умолчанию
    // this.name = this.files.images[0].split('.').slice(0, -1).join('.');
    this.name = this.files.c_location!;
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

  is_first = true;
  @HostListener('window:resize')
  resize() {
    // if (this.is_first) {
    //   this.is_first = false;
    //   return;
    // }
    this.runWithTimeout(() => {
      const old_scale = this.scale;
      if (this.img)
        this.scale = Math.min(
          (document.documentElement.clientWidth - 300) / this.img.width,
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

  drawGrid() {
    // this.scale = Math.min(
    //   this.width1 / this.img.width,
    //   this.height1 / this.img.height
    // );
    this.width1 = this.img.width * this.scale;
    this.height1 = this.img.height * this.scale;
    // this.canvas.width = this.width1;
    // this.canvas.height = this.height1;
    this.cdr.detectChanges();
    this.ctx.clearRect(0, 0, this.width1, this.height1); // Очистка this.canvas
    this.ctx.drawImage(this.img, 0, 0, this.width1, this.height1);
    if (this.grid) {
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

  updateCanvasGrid() {
    this.drawGrid(); // Перерисовка сетки с новым размером
  }

  // onAddImage() {
  //   const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  //   fileInput.click();
  // }
  // onFileSelected(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files && input.files[0]) {
  //     const file = input.files[0];
  //     const reader = new FileReader();

  //     reader.onload = async () => {
  //       const imageSrc = reader.result as string;
  //       this.canvasInit(imageSrc); // Обновляем canvas

  //       this.saveImagePath(file.name, Buffer.from(await file.arrayBuffer())); // Сохраняем путь
  //     };

  //     reader.readAsDataURL(file);
  //   }
  // }

  // async saveImagePath(fileName: string, file: Buffer) {
  //   const fullPath = `${this.files['path']}${fileName}`;
  //   this.elec.fs.writeFile(`${this.files.path}/${fileName}`, file, (err) => {
  //     if (err) {
  //       console.error('Error saving file:', err);
  //     } else {
  //       console.log('File saved successfully.');
  //     }
  //   });
  //   console.log(`Saving image path: ${fullPath}`);
  //   // Здесь можно добавить логику для сохранения пути в сервисе
  // }

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
      if (this.type == 'Сетка') this.gridMove(x, y);
      else if (this.type == 'Туман') this.tymanCreate(x, y);
      this.drawGrid();
    }
  }

  tymanCreate(x: number, y: number) {
    const x1 = this.clickedX;
    const y1 = this.clickedY;
    // this.tmp_tyman = (color = this.color_of_tyman) => {
    //   this.ctx.fillStyle = color;
    //   this.ctx.fillRect(x1, y1, Math.floor(x - x1), Math.floor(y - y1));
    // };
    this.tmp_tyman = {
      id: Number(this.tyman.at(-1)?.id ?? 0) + 1 + '',
      x: x1,
      y: y1,
      w: Math.floor(x - x1),
      h: Math.floor(y - y1),
    };
  }

  gridMove(x: number, y: number) {
    const dx = this.clickedX - x;
    if (dx > 0) {
      this.x = this.gridSize - (dx % this.gridSize);
    } else {
      this.x = Math.abs(this.clickedX - x) % this.gridSize;
    }
    const dy = this.clickedY - y;
    if (dy > 0) {
      this.y = this.gridSize - (dy % this.gridSize);
    } else {
      this.y = Math.abs(this.clickedY - y) % this.gridSize;
    }
  }

  get dataToSave() {
    return JSON.stringify(
      {
        gridSize: this.gridSize,
        lineWidth: this.lineWidth,
        x: this.x,
        y: this.y,
        width: this.width1,
        height: this.height1,
        size: Number(this.size),
        tyman: this.tyman,
        scale: this.scale,
        version: this.version,
        grid: this.grid
      },
      null,
      4
    );
  }
  saveAll() {
    this.elec.fs.writeFileSync(
      this.elec.path.join(
        this.files.path,
        this.files.c_comp!,
        this.name + '.json'
      ),
      this.dataToSave
    );
  }
  goBack() {
    this.router.navigate(['']);
  }
  test(t: any) {
    console.log(t);
  }

  deleteTyman() {
    this.tyman = this.tyman.filter((e) => e != this.current_tyman);
    this.drawGrid();
  }
  selectTyman(item: tymanRect) {
    if (this.current_tyman == item) this.current_tyman = undefined;
    else this.current_tyman = item;
    this.drawGrid();
  }
}
export interface tymanRect {
  id: string;
  // func: (color?: string) => void;
  x: number;
  y: number;
  w: number;
  h: number;
  // [i: string]: number
}
