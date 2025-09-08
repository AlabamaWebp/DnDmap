import { Router } from '@angular/router';
import { tymanRect } from '../../electron/card-creator/card-creator.component';
import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
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
  figure: false | figures = false;
  figure_coord?: figure_coord;
  saved_figures: { [i: string]: figure_coord[] } = {};
  erase = false;
  current_fishka?: fishka;
  monsters = new monster(['rgb(109, 33, 33)', 'rgb(37, 37, 37)']);
  no_gamedata = true;
  loading = true;
  grid: boolean = false;
  gamers: Gamers = new Gamers([
    'rgb(252, 161, 176)',
    'rgb(120, 201, 233)',
    'rgb(247, 83, 83)',
    'rgb(187, 129, 241)',
    'rgb(68, 248, 143)',
  ]);

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    const g = localStorage.getItem('gamers');
    if (g) {
      this.gamers.changeGamersCount(Number(g));
    }
  }
  countGamers(n: number) {
    this.gamers.changeGamersCount(n);
    localStorage.setItem('gamers', n + '');
  }
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
    if (obj.current != target) {
      this.sbros_all();
      obj.current = target;
    } else obj.current = undefined;
    this.drawGrid();
  }

  runWithTimeout(func: () => void) {
    requestAnimationFrame(func);
  }

  canvClick(event: MouseEvent) {
    if (event.button === 0) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.clickedX = x;
      this.clickedY = y;
      this.isClicked = true;
      let is_erased = false;
      if (!this.gamers.current && !this.monsters.current && !this.figure) {
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
                is_erased = true;
              } else {
                this.current_fishka = new fishka(c, true, e);
              }
              break;
            }
          }
        });
        if (this.erase && !is_erased) {
          // только для фигур стёрка
          const coord = {
            x: this.getCoordTmp(x, this.x),
            y: this.getCoordTmp(y, this.y),
          };
          Object.keys(this.saved_figures).forEach((k) => {
            is_erased = this.saved_figures[k].some(
              (v) => v.from.x === coord.x && v.from.y === coord.y
            );
            this.saved_figures[k] = this.saved_figures[k].filter((v) => {
              return !(v.from.x === coord.x && v.from.y === coord.y);
            });
          });
        }
        Object.keys(this.gamers.draw).forEach((e) => {
          const c = this.gamers.draw[e];
          const px = x - c.x + this.gridSize / 2;
          const py = y - c.y + this.gridSize / 2;
          if (px > 0 && px < this.gridSize && py > 0 && py < this.gridSize) {
            if (this.erase && !is_erased) {
              delete this.gamers.draw[e];
            } else if (!is_erased) {
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

      if (this.figure) {
        if (!this.figure_coord)
          this.figure_coord = {
            from: {
              x: this.getCoordTmp(x, this.x),
              y: this.getCoordTmp(y, this.y),
            },
          };
        else this.figure_coord.to = { x: x, y: y };
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
    let obj: monster | Gamers | undefined = this.gamers.current
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
        'grid',
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
      this.createRect(e);
    });
    this.createRect();
    this.createFishka();
    Object.keys(this.gamers.draw).forEach((c) => {
      this.createFishka(this.gamers.draw[c], c);
    });
    this.createFishka(this.monsters.tmp, this.monsters.current, true);
    Object.keys(this.monsters.draw).forEach((c) => {
      this.monsters.draw[c].forEach((el) => {
        this.createFishka(el, c, true);
      });
    });
    this.figureChoice();
    Object.keys(this.saved_figures).forEach((k) => {
      this.saved_figures[k].forEach((v) => {
        this.figureChoice(k, v as any);
      });
    });
    if (this.figure_coord?.from) {
      const A = this.figure_coord?.from;
      this.ctx.fillStyle = 'red';
      this.ctx.beginPath();
      this.ctx.arc(A.x, A.y, 5, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }
  figureChoice(
    f: string | false = this.figure,
    f2: figure_coord | undefined = this.figure_coord
  ) {
    if (!f || !f2) return;
    else if (f == 'circle') this.createCircle(f2!);
    else if (f == 'rectangle') this.createRectangle(f2!);
    else if (f == 'filter_list') this.createTreangle(f2!);
  }
  createRectangle(f: figure_coord) {
    if (f?.to) {
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
      this.textToFigure(sideLength, midX, midY);
    }
  }
  createCircle(f: figure_coord) {
    if (f?.to) {
      const center = f.from;
      const pointOnCircumference = f.to;

      const radius = Math.sqrt(
        Math.pow(pointOnCircumference.x - center.x, 2) +
          Math.pow(pointOnCircumference.y - center.y, 2)
      );

      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(center.x, center.y);
      this.ctx.lineTo(pointOnCircumference.x, pointOnCircumference.y);
      this.ctx.stroke();

      const midX = (center.x + pointOnCircumference.x) / 2;
      const midY = (center.y + pointOnCircumference.y) / 2;
      this.textToFigure(radius, midX, midY);
    }
  }
  createTreangle(f: figure_coord) {
    if (f?.to) {
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
      this.ctx.beginPath();
      this.ctx.moveTo(A.x, A.y);
      this.ctx.lineTo(B.x, B.y);
      this.ctx.lineTo(C.x, C.y);
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(A.x, A.y);
      this.ctx.lineTo(B.x, B.y);
      this.ctx.lineTo(D.x, D.y);
      this.ctx.closePath();
      this.ctx.stroke();
      const midX = (A.x + B.x) / 2;
      const midY = (A.y + B.y) / 2;
      this.textToFigure(len, midX, midY);
    }
  }
  textToFigure(delitel: number, x: number, y: number) {
    const foot = (delitel / this.gridSize) * this.size - this.size / 2;
    const metr = foot * 0.3048;
    const len2 = `${Number(foot.toFixed(0))}фт (${Number(metr.toFixed(1))}м)`;
    this.textTo(len2, x, y);
  }
  textTo(text: string, x: number, y: number) {
    this.ctx.font = '25px Arial';
    this.ctx.strokeStyle = 'black';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.strokeText(text, x, y);
    this.ctx.fillText(text, x, y);
  }
  createFishka(
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
    // const imagePath = 'assets/tyman.jpg';
    // if (!this.img_tyman) {
    //   this.img_tyman = await new Promise<HTMLImageElement>(
    //     (resolve, reject) => {
    //       const image = new Image();
    //       image.src = imagePath;
    //       image.onload = () => resolve(image);
    //       image.onerror = reject;
    //     }
    //   );
    // }
    // Создаём canvas для размытого слоя
    // const blurCanvas = document.createElement('canvas');
    // const scale = 0; // немного увеличиваем для размытия краёв
    // const scaledWidth = rect.w;
    // const scaledHeight = rect.h;
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    // blurCanvas.width = scaledWidth;
    // blurCanvas.height = scaledHeight;
    // const blurCtx = blurCanvas.getContext('2d')!;
    // Применяем размытие и рисуем увеличенное изображение для размытия краёв
    // blurCtx.filter = 'blur(5px)';
    // blurCtx.drawImage(
    //   this.img_tyman,
    // (rect.w - scaledWidth) / 2 + scale,
    // (rect.h - scaledHeight) / 2 + scale,
    // rect.w,
    // rect.h
    // );
    // this.ctx.drawImage(blurCanvas, rect.x, rect.y);
  }

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
    const tmp = !this.erase;
    this.sbros_all();
    this.erase = tmp;
  }
  toggleFigure() {
    const figures: figures[] = ['filter_list', 'circle', 'rectangle'];
    let tmp = this.figure;
    let current = (tmp ? figures.indexOf(tmp) : -1) + 1;
    if (current == figures.length) tmp = figures[0];
    else tmp = figures[current];
    this.sbros_all();
    this.figure = tmp;
    this.drawGrid();
  }
  unselectFigure() {
    this.figure = false;
    this.figure_coord = undefined;
  }
  sbros_all() {
    this.gamers.current = undefined;
    this.gamers.tmp = undefined;
    this.monsters.current = undefined;
    this.monsters.tmp = undefined;
    this.erase = false;
    this.figure = false;
    this.figure_coord = undefined;
  }
  saveFigure() {
    if (this.figure) {
      const tmp = this.saved_figures[this.figure] ?? [];
      this.saved_figures[this.figure] = [...tmp, this.figure_coord!];
      this.sbros_all();
      this.drawGrid();
    }
  }
}

interface figure_coord {
  from: coord;
  to?: coord;
}
type figures = 'filter_list' | 'circle' | 'rectangle';
// треугольник, круг, квадрат
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
class Gamers extends fishki {
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
  elem.requestFullscreen();
}
function closeFullscreen() {
  document.exitFullscreen();
}
