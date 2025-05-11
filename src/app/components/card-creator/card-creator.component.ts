import {
  ChangeDetectorRef,
  Component,
  HostListener,
  ViewChild,
} from '@angular/core';
import { ElectronService } from '../../shared/services/electron.service';
import { ImageFilesService } from '../../shared/services/image-files.service';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-card-creator',
  imports: [MatSliderModule, FormsModule],
  templateUrl: './card-creator.component.html',
  styleUrl: './card-creator.component.scss',
})
export class CardCreatorComponent {
  gridSize = 80; // Размер сетки по умолчанию
  lineWidth = 1; // Ширина линий по умолчанию
  x = 0.5;
  y = 0.5;
  width = 0;
  height = 0;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  img!: HTMLImageElement;
  clickedX = 0;
  clickedY = 0;
  isClicked = false;

  constructor(
    private elec: ElectronService,
    private files: ImageFilesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log(this.elec.platform);
    this.canvas = document.querySelector('#canvas1') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    // this.ctx.strokeStyle = 'black'; // Цвет линии
    this.canvasInit();
  }

  canvasInit(imageSrc?: string) {
    this.img = new Image();

    this.img.src = imageSrc || this.files.path + this.files.folders[0]; // Путь по умолчанию

    this.img.onload = () => {
      this.width = this.img.width;
      this.height = this.img.height;
      this.cdr.detectChanges();

      this.drawGrid(); // Рисуем сетку
    };
  }

  drawGrid() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Очистка this.canvas
    this.ctx.drawImage(this.img, 0, 0, this.width, this.height);
    this.ctx.strokeStyle = 'rgba(0,0,0,0.5)'; // Цвет и прозрачность линий
    this.ctx.lineWidth = 1;
    // Рисуем вертикальные линии
    for (let x = this.x; x < this.width; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.strokeStyle = 'black';
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    // Рисуем горизонтальные линии
    for (let y = this.y; y < this.height; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.strokeStyle = 'black';
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
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
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.clickedX = x;
    this.clickedY = y;
    this.isClicked = true;
  }
  canvUnclick() {
    this.clickedX = -1;
    this.clickedY = -1;
    this.isClicked = false;
  }
  canvMove(event: MouseEvent) {
    if (this.isClicked) {
      const rect = this.canvas.getBoundingClientRect();
      console.log(event.clientX, event.clientY);
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
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
      this.drawGrid();
    }
  }
}
