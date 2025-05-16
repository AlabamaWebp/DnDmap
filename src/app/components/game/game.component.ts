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
    MatInput,
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
  // gavno
  getGamedata() {
    this.http.get('pricol/gamedata.json').subscribe((e: any) => {
      this.images = e;
      this.c_image = this.images[0];
      this.loadJson();
      this.canvasInit();
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
    private router: Router,
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
                  (e) => e != c,
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
              (e) => e !== this.current_fishka?.coord,
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
          document.documentElement.clientHeight / this.img.height,
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
    monster = false,
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

  createRect(
    rect: tymanRect = this.tmp_tyman!,
    color: string = this.color_of_tyman,
  ) {
    if (!rect) return;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
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
