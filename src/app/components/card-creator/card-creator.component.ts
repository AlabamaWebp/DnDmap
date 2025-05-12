import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { ElectronService } from '../../shared/services/electron.service';
import { ImageFilesService } from '../../shared/services/image-files.service';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-card-creator',
  imports: [
    MatSliderModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
  ],
  templateUrl: './card-creator.component.html',
  styleUrl: './card-creator.component.scss',
})
export class CardCreatorComponent {
  gridSize = 80; // Размер сетки по умолчанию
  lineWidth = 1; // Ширина линий по умолчанию
  x = 0.5;
  y = 0.5;
  width1 = document.documentElement.clientWidth - 300;
  height1 = document.documentElement.clientHeight;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  img!: HTMLImageElement;
  clickedX = 0;
  clickedY = 0;
  isClicked = false;
  isMoved = false;
  size = 5;
  name!: string;
  type: 'Сетка' | 'Туман' = 'Туман';
  tyman: tyman[] = [];
  current_tyman?: tyman;
  tmp_tyman?: () => void;

  constructor(
    private elec: ElectronService,
    private files: ImageFilesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.canvas = document.querySelector('#canvas1') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.loadJson();
    this.canvasInit();
  }

  loadJson() {
    if (!this.files.jsons[0]) return;
    const data = JSON.parse(
      this.elec.fs
        .readFileSync(this.files.path + this.files.jsons[0])
        .toString()
    );
    const vars = ['gridSize', 'lineWidth', 'x', 'y', 'width', 'height', 'size'];
    const t: any = this;
    for (const e of vars) {
      t[e] = data[e];
    }
  }

  canvasInit(imageSrc?: string) {
    // const test = this.elec.fs.readFileSync("")
    this.img = new Image();
    this.img.src = "file://" + (imageSrc || this.files.path + this.files.images[0]); // Путь по умолчанию
    this.name = this.files.images[0].split('.').slice(0, -1).join('.');
    this.img.onload = () => {
      // this.width = this.canvas.clientWidth;
      // this.height = this.canvas.clientHeight;
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
      this.cdr.detectChanges();

      this.drawGrid(); // Рисуем сетку
    };
  }

  drawGrid() {
    let scale = Math.min(
      this.width1 / this.img.width,
      this.height1 / this.img.height
    );
    this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight); // Очистка this.canvas
    this.ctx.drawImage(
      this.img,
      0,
      0,
      this.img.width * scale,
      this.img.height * scale
    );

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
    this.tyman.forEach(e => {
      if (e == this.current_tyman)
        e.func("rgb(255,160,122)");
      else
        e.func();
    })
    this.tmp_tyman?.();
  }

  updateCanvasGrid() {
    this.drawGrid(); // Перерисовка сетки с новым размером
  }

  onAddImage() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = async () => {
        const imageSrc = reader.result as string;
        this.canvasInit(imageSrc); // Обновляем canvas

        this.saveImagePath(file.name, Buffer.from(await file.arrayBuffer())); // Сохраняем путь
      };

      reader.readAsDataURL(file);
    }
  }

  async saveImagePath(fileName: string, file: Buffer) {
    const fullPath = `${this.files['path']}${fileName}`;
    this.elec.fs.writeFile(`${this.files.path}/${fileName}`, file, (err) => {
      if (err) {
        console.error('Error saving file:', err);
      } else {
        console.log('File saved successfully.');
      }
    });
    console.log(`Saving image path: ${fullPath}`);
    // Здесь можно добавить логику для сохранения пути в сервисе
  }

  canvClick(event: MouseEvent) {
    console.log(event);
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
    if (this.type == "Туман" && this.isClicked && this.isMoved) {
      this.tyman.push({ id: Number(this.tyman.at(-1)?.id ?? 0) + 1 + "", func: this.tmp_tyman! })
    }
    this.clickedX = -1;
    this.clickedY = -1;
    this.isClicked = false;
    this.tmp_tyman = undefined;
  }
  canvMove(event: MouseEvent) {
    if (this.isClicked) {
      this.isMoved = true
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

    this.tmp_tyman = (color = 'rgb(0 0 0 / 50%)') => {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(
        x1,
        y1,
        Math.floor(x - x1),
        Math.floor(y - y1)
      );
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
      },
      null,
      4
    );
  }
  saveAll() {
    this.elec.fs.writeFileSync(
      this.files.path + this.name + '.json',
      this.dataToSave
    );
  }
  test(t: any) {
    console.log(t);
  }
  deleteTyman() {
    this.tyman = this.tyman.filter(e => e != this.current_tyman);
    this.drawGrid();
  }
  
}
interface tyman {
  id: string
  func: (color?: string) => void
}