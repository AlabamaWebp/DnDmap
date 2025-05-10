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
  canvasWork() {
    const win = window as any;
    var canvas = document.getElementById('canvas') as HTMLCanvasElement;
    var ctx = canvas.getContext('2d')!;
    var img = new Image();

    // img.src = '/images/Faerun+Lore+and+Legends+Blando+Sample+1AA.jpg'; // укажите путь к картинке
    const imgPath = win.paths.getImagePath().replace('app\\', '');
    img.src = `${imgPath}`; // укажите путь к картинке

    img.onload = function () {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Настройки сетки
      var step = 20; // размер ячейки сетки в пикселях
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; // цвет и прозрачность линий
      ctx.lineWidth = 1;

      // Рисуем вертикальные линии
      for (var x = 0.5; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Рисуем горизонтальные линии
      for (var y = 0.5; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };
  }
}
