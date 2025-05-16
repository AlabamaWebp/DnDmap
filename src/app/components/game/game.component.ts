import { Router } from '@angular/router';
import { tymanRect } from '../card-creator/card-creator.component';
import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-game',
  imports: [
    MatFormFieldModule,
    FormsModule,
    MatButtonModule,
    MatIcon,
    MatMenuModule,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent {
  gridSize = 80; // Размер сетки по умолчанию
  lineWidth = 1; // Ширина линий по умолчанию
  x = 0.5;
  y = 0.5;
  width1 = document.documentElement.clientWidth - 300;
  height1 = document.documentElement.clientHeight;
  canvas!: HTMLCanvasElement;
  img!: HTMLImageElement;
  clickedX = 0;
  clickedY = 0;
  isClicked = false;
  isMoved = false;
  size = 5;
  type: 'Сетка' | 'Туман' = 'Туман';
  img_tyman?: HTMLImageElement;
  tyman: tymanRect[] = [];
  tmp_tyman?: tymanRect;
  color_of_tyman = 'rgb(0 0 0 / 100%)';
  scale!: number;
  version = 1;
  timeout?: any;
  images: string[] = [];
  c_image!: string;
  erase = false;
  current_fishka?: fishka;
  monsters = new monster(['rgb(109, 33, 33)', 'rgb(37, 37, 37)']);
  no_gamedata = true;
  loading = true;
  gamers = new gamer([
    'rgb(252, 161, 176)',
    'rgb(51, 51, 131)',
    'rgb(148, 51, 51)',
    'rgb(148, 117, 51)',
    'rgb(51, 148, 91)',
  ]);
  get ctx() {
    return this.canvas.getContext('2d')!;
  }
  fullscreen = false;
  toggleFullscreen() {
    this.fullscreen = !this.fullscreen;
    this.fullscreen ? openFullscreen() : closeFullscreen();
  }
  getGamedata() {
    this.http.get('pricol/gamedata.json').subscribe({
      next: (e: any) => {
        this.images = e;
        this.c_image = this.images[0];
        this.loadJson();
        this.canvasInit();
        this.no_gamedata = false;
        this.loading = false;
      },
      error: () => {},
    });
  }
  selectObj(target: string, monster = false) {
    const obj = monster ? this.monsters : this.gamers;
    const to_deslect = !monster ? this.monsters : this.gamers;
    to_deslect.current = undefined;
    to_deslect.tmp = undefined;
    if (obj.current != target) obj.current = target;
    else obj.current = undefined;
    obj.tmp = undefined;
    this.erase = false;
    this.drawGrid();
  }

  countGamers(n: number) {
    this.gamers.changeGamersCount(n);
  }

  constructor(
    // private elec: ElectronService,
    // private files: ImageFilesService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}
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
      if (!this.gamers.current && !this.monsters.current) {
        const is_fishka = !!this.current_fishka;
        Object.keys(this.monsters.draw).forEach((e) => {
          for (const c of this.monsters.draw[e]) {
            const px = x - c.x + this.gridSize / 2;
            const py = y - c.y + this.gridSize / 2;
            if (px > 0 && px < this.gridSize && py > 0 && py < this.gridSize) {
              if (this.erase) {
                this.monsters.draw[e] = this.monsters.draw[e].filter(
                  (e) => e != c
                );
              } else {
                this.current_fishka = new fishka(c, true, e);
              }
              break;
            }
          }
        });
        Object.keys(this.gamers.draw).forEach((e) => {
          const c = this.gamers.draw[e];
          const px = x - c.x + this.gridSize / 2;
          const py = y - c.y + this.gridSize / 2;
          if (px > 0 && px < this.gridSize && py > 0 && py < this.gridSize) {
            if (this.erase) {
              delete this.gamers.draw[e];
            } else {
              this.current_fishka = new fishka(c, false, e);
            }
          }
        });
        if (is_fishka && this.current_fishka) {
          const coord = {
            x: this.getCoordTmp(x, this.x),
            y: this.getCoordTmp(y, this.y),
          };
          if (this.current_fishka.monster) {
            const draw = this.monsters.draw[this.current_fishka.color];
            this.monsters.draw[this.current_fishka.color] = draw.filter(
              (e) => e !== this.current_fishka?.coord
            );
            this.monsters.draw[this.current_fishka.color].push(coord);
          } else {
            this.gamers.draw[this.current_fishka.color] = coord;
          }
          this.current_fishka = undefined;
        }
      }
      this.gamers.addToDraw();
      this.monsters.addToDraw();
      this.drawGrid();
    }
  }
  @HostListener('document:mouseup', ['event'])
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
    const rect = this.canvas.getBoundingClientRect();
    const x = event.x - rect.left;
    const y = event.clientY - rect.top;
    if (this.isClicked) {
      this.isMoved = true;
      this.drawGrid();
    }
    let obj: monster | gamer | undefined = this.gamers.current
      ? this.gamers
      : undefined;
    if (this.monsters.current) obj = this.monsters;
    if (obj) {
      obj.tmp = {
        x: this.getCoordTmp(x, this.x),
        y: this.getCoordTmp(y, this.y),
      };
      this.drawGrid();
    }
  }
  clearTmp() {
    this.monsters.tmp = undefined;
    this.gamers.tmp = undefined;
    this.drawGrid();
  }
  getCoordTmp(a: number, b: number) {
    return (
      Math.floor((a - b) / this.gridSize) * this.gridSize +
      b +
      this.gridSize / 2
    );
  }

  @HostListener('window:resize')
  resize() {
    this.runWithTimeout(() => {
      const old_scale = this.scale;
      if (this.img)
        this.scale = Math.max(
          document.documentElement.clientWidth / this.img.width,
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
    this.getGamedata();
    this.canvas = document.querySelector('#canvas1') as HTMLCanvasElement;
  }

  canvasInit() {
    this.img = new Image();
    this.img.src = 'pricol/' + this.c_image;
    this.img.onload = () => {
      const old_scale = this.scale;
      this.resize();
      this.doScale(old_scale);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
      this.cdr.detectChanges();

      this.drawGrid(); // Рисуем сетку
    };
  }

  loadJson() {
    this.http.get('pricol/' + this.c_image + '.json').subscribe((data: any) => {
      if (data.version != this.version) return;
      const vars = [
        'gridSize',
        'lineWidth',
        'x',
        'y',
        'size',
        'tyman',
        'scale',
      ];
      const t: any = this;
      for (const e of vars) {
        t[e] = data[e];
      }
    });
  }

  doScale(old_scale: number) {
    const t: any = this;
    const scale = 1 + (this.scale - old_scale) / old_scale;

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
      this.createRect(e);
    });
    this.createRect();
    this.createCircle();
    Object.keys(this.gamers.draw).forEach((c) => {
      this.createCircle(this.gamers.draw[c], c);
    });
    this.createCircle(this.monsters.tmp, this.monsters.current, true);
    Object.keys(this.monsters.draw).forEach((c) => {
      this.monsters.draw[c].forEach((el) => {
        this.createCircle(el, c, true);
      });
    });
  }
  createCircle(
    d: coord | undefined = this.gamers.tmp,
    color: string | undefined = this.gamers.current,
    monster = false
  ) {
    if (!d || !color) return;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(d.x, d.y, this.gridSize / 2, 0, 2 * Math.PI, false);
    this.ctx.fill();
    this.ctx.lineWidth = 3;
    if (this.current_fishka?.coord == d)
      this.ctx.strokeStyle = 'rgb(255, 255, 0)';
    else
      this.ctx.strokeStyle = !monster ? 'rgb(255, 255, 255)' : 'rgb(255, 0, 0)';

    this.ctx.stroke();
  }

  async createRect(
    rect: tymanRect = this.tmp_tyman!,
    color: string = this.color_of_tyman
  ) {
    if (!rect) return;
    const imagePath = 'assets/tyman.jpg';
    if (!this.img_tyman) {
      this.img_tyman = await new Promise<HTMLImageElement>(
        (resolve, reject) => {
          const image = new Image();
          image.src = imagePath;
          image.onload = () => resolve(image);
          image.onerror = reject;
        }
      );
    }
    // Создаём canvas для размытого слоя
    const blurCanvas = document.createElement('canvas');
    const scale = 0; // немного увеличиваем для размытия краёв
    const scaledWidth = rect.w;
    const scaledHeight = rect.h;
    blurCanvas.width = scaledWidth;
    blurCanvas.height = scaledHeight;
    const blurCtx = blurCanvas.getContext('2d')!;
    // Применяем размытие и рисуем увеличенное изображение для размытия краёв
    blurCtx.filter = 'blur(5px)';
    blurCtx.drawImage(
      this.img_tyman,
      (rect.w - scaledWidth) / 2 + scale,
      (rect.h - scaledHeight) / 2 + scale,
      rect.w,
      rect.h
    );
    this.ctx.drawImage(blurCanvas, rect.x, rect.y);
    // this.ctx.filter = 'none';
    // this.ctx.drawImage(this.img_tyman, rect.x, rect.y, rect.w, rect.h);
  }

  // async createRect(
  //   rect: tymanRect = this.tmp_tyman!,
  //   color: string = this.color_of_tyman
  // ) {
  //   if (!rect) return;
  //   const imagePath: string = 'assets/tyman.jpg';
  //   const blurRadius: number = 1000;
  //   if (!this.img_tyman) {
  //     this.img_tyman = await new Promise<HTMLImageElement>(
  //       (resolve, reject) => {
  //         const image = new window.Image();
  //         image.src = imagePath;
  //         image.onload = () => resolve(image);
  //         image.onerror = reject;
  //       }
  //     );
  //   }
  //   const imgCanvas = document.createElement('canvas');
  //   imgCanvas.width = rect.w;
  //   imgCanvas.height = rect.h;
  //   imgCanvas.getContext('2d')!.drawImage(this.img_tyman, 0, 0, rect.w, rect.h);
  //   this.ctx.drawImage(imgCanvas, rect.x, rect.y);
  // }

  // createRect(
  //   rect: tymanRect = this.tmp_tyman!,
  //   color: string = this.color_of_tyman
  // ) {
  //   if (!rect) return;

  //   this.ctx.save();

  //   // Задаем фильтр размытия для мягкости тумана
  //   this.ctx.filter = 'blur(10px)';

  //   // Создаем линейный градиент от белого (или светло-серого) к прозрачному
  //   // для эффекта объемного тумана
  //   const gradient = this.ctx.createRadialGradient(
  //     rect.x + rect.w / 2,
  //     rect.y + rect.h / 2,
  //     Math.min(rect.w, rect.h) / 4,
  //     rect.x + rect.w / 2,
  //     rect.y + rect.h / 2,
  //     Math.max(rect.w, rect.h) / 2
  //   );
  //   gradient.addColorStop(0, 'rgb(179, 179, 179)'); // плотный светлый центр
  //   gradient.addColorStop(1, 'rgb(175, 175, 175)');   // прозрачные края

  //   this.ctx.fillStyle = gradient;

  //   // Заполняем всю прямоугольную область градиентом
  //   this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  //   this.ctx.restore();
  // }

  removeGamer(gamer: string) {
    delete this.gamers.draw[gamer];
    this.drawGrid();
  }
  delTyman(id: string) {
    this.tyman = this.tyman.filter((e) => e.id !== id);
    this.drawGrid();
  }
  goTo(i: string) {
    this.c_image = i;
    this.loadJson();
    this.canvasInit();
    Object.keys(this.monsters.draw).forEach((e) => {
      this.monsters.draw[e] = [];
    });
    Object.keys(this.gamers.draw).forEach((e) => {
      delete this.gamers.draw[e];
    });
  }
  eraser() {
    this.erase = !this.erase;
    this.monsters.current = undefined;
    this.gamers.current = undefined;
  }
}

interface coord {
  x: number;
  y: number;
}
class fishki {
  constructor(all: string[]) {
    this.all = all;
  }
  all: string[];
  tmp?: coord;
  current?: string;
}
class gamer extends fishki {
  constructor(all: string[], count = 0) {
    super(all);
    this.all_backup = all.slice();
    this.count = count;
  }
  changeGamersCount(n: number) {
    this.count = n;
    this.all = this.all_backup.slice(0, n);
  }
  addToDraw() {
    if (this.current) {
      this.draw[this.current] = this.tmp!;
      this.current = undefined;
      this.tmp = undefined;
    }
  }
  all_backup: string[];
  draw: { [i: string]: coord } = {};
  count: number;
  max = Array.from({ length: this.all.length }, (_, i) => ++i);
}
class monster extends fishki {
  constructor(all: string[]) {
    super(all);
    this.all.forEach((e) => {
      this.draw[e] = [];
    });
  }
  draw: { [i: string]: coord[] } = {};
  addToDraw() {
    if (this.current) {
      this.draw[this.current].push(this.tmp!);
      this.current = undefined;
      this.tmp = undefined;
    }
  }
}
class fishka {
  constructor(c: coord, m: boolean, col: string) {
    this.coord = c;
    this.monster = m;
    this.color = col;
  }
  coord: coord;
  monster: boolean;
  color: string;
}
function openFullscreen(elem = document.documentElement) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  }
  // else if (elem.mozRequestFullScreen) { /* Firefox */
  //   elem.mozRequestFullScreen();
  // } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari, Opera */
  //   elem.webkitRequestFullscreen();
  // } else if (elem.msRequestFullscreen) { /* IE/Edge */
  //   elem.msRequestFullscreen();
  // }
}
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }
  // else if (document.mozCancelFullScreen) { /* Firefox */
  //   document.mozCancelFullScreen();
  // } else if (document.webkitExitFullscreen) { /* Chrome, Safari, Opera */
  //   document.webkitExitFullscreen();
  // } else if (document.msExitFullscreen) { /* IE/Edge */
  //   document.msExitFullscreen();
  // }
}
