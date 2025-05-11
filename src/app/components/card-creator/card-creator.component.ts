import { Component } from '@angular/core';
import { ElectronService } from '../../shared/services/electron.service';
import { ImageFilesService } from '../../shared/services/image-files.service';

@Component({
  selector: 'app-card-creator',
  imports: [],
  templateUrl: './card-creator.component.html',
  styleUrl: './card-creator.component.scss',
})
export class CardCreatorComponent {
  constructor(
    private elec: ElectronService,
    private files: ImageFilesService
  ) {}

  ngOnInit() {
    console.log(this.elec.platform);
    this.canvasWork();
  }

  canvasWork(imageSrc?: string) {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.src = imageSrc || '/default/path/to/image.jpg'; // Путь по умолчанию

    img.onload = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Очистка canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Настройки сетки
      const step = 20; // размер ячейки сетки в пикселях
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; // цвет и прозрачность линий
      ctx.lineWidth = 1;

      // Рисуем вертикальные линии
      for (let x = 0.5; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Рисуем горизонтальные линии
      for (let y = 0.5; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };
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

      reader.onload = async() => {
        const imageSrc = reader.result as string;
        this.canvasWork(imageSrc); // Обновляем canvas
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
}
