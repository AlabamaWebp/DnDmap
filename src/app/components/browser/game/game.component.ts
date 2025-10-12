import { Router } from '@angular/router';
import { tymanRect } from '../../electron/card-creator/card-creator.component';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient } from '@angular/common/http';
import {
  CanvasGameService,
  ICanvasParams,
  ICoords,
  IGridParameters,
  IVector2d,
} from './canvas-game.service';

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
  providers: [CanvasGameService],
  templateUrl: './game.component.html',
  // styleUrl: './game.component.scss',
  styles: [
    `
      @import './game.component.scss';
    `,
  ],
})
export class GameComponent {
  // @ViewChild('canvas1')
  get canvas_params() {
    return this.cs.params;
  }
  get canvas_rect() {
    return this.cs.canvas.getBoundingClientRect();
  }
  clicked?: ICoords;
  isMoved = false;
  type: 'Сетка' | 'Туман' = 'Туман';
  img_tyman?: HTMLImageElement;
  tyman: tymanRect[] = [];
  tmp_tyman?: tymanRect;
  private readonly color_of_tyman = 'rgb(0 0 0 / 100%)';
  scale!: number;
  version = 1;
  timeout?: any;
  images: string[] = [];
  c_image!: string;
  current_figure: false | figures = false;
  tmp_figure?: figure_coord;
  saved_figures: { [i: string]: figure_coord[] } = {};
  erase = false;
  current_fishka?: fishka;
  monsters = new monster(['rgb(109, 33, 33)', 'rgb(37, 37, 37)']);
  no_gamedata = true;
  loading = true;
  draw_grid: boolean = false;
  gamers: Gamers = new Gamers([
    'rgb(252, 161, 176)',
    'rgb(120, 201, 233)',
    'rgb(247, 83, 83)',
    'rgb(187, 129, 241)',
    'rgb(68, 248, 143)',
  ]);

  admin_panel = false;
  get img() {
    return this.cs.img;
  }
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private cs: CanvasGameService
  ) {
    const g = localStorage.getItem('gamers');
    if (g) {
      this.gamers.changeGamersCount(Number(g));
    }
  }
  ngOnInit() {
    this.getGamedata();
  }
  countGamers(n: number) {
    this.gamers.changeGamersCount(n);
    localStorage.setItem('gamers', n + '');
  }
  fullscreen = false;
  toggleFullscreen() {
    this.fullscreen = !this.fullscreen;
    this.fullscreen ? openFullscreen() : closeFullscreen();
  }
  getGamedata() {
    this.http.get('pricol/gamedata.json').subscribe({
      next: (e: any) => {
        this.loading = false;
        this.images = e;
        this.c_image = this.images[0];
        this.loadJson();
        this.no_gamedata = false;
        this.runWithTimeout(() => {
          this.cs.init(document.querySelector('#canvas1')!);
          this.canvasInit();
        });
      },
      // error: () => {},
    });
  }
  selectObj(target: string, monster = false) {
    const obj = monster ? this.monsters : this.gamers;
    if (obj.current != target) {
      this.clearState();
      obj.current = target;
    } else obj.current = undefined;
    this.refreshCanvas();
  }

  runWithTimeout(func: () => void) {
    requestAnimationFrame(func);
  }

  private coordObjFinder(mas: ICoords[], x: number, y: number, size: number) {
    for (const [i, c] of mas.entries()) {
      const px = x - c.x + size / 2;
      const py = y - c.y + size / 2;
      if (px > 0 && px < size && py > 0 && py < size) {
        return i;
      }
    }
    return -1;
  }

  canvClick(event: MouseEvent) {
    if (event.button === 0) {
      const rect = this.canvas_rect;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.clicked = {
        x,
        y,
      };
      const size = this.canvas_params.grid.size;

      let stop = false;
      if (
        !this.gamers.current &&
        !this.monsters.current &&
        !this.current_figure
      ) {
        if (this.erase) {
          //Удаление
          // Монстра
          for (const e in this.monsters.draw) {
            const i = this.coordObjFinder(this.monsters.draw[e], x, y, size);
            if (i != -1) {
              this.monsters.draw[e].splice(i, 1);
              stop = true;
              break;
            }
          }
          // Игрока
          if (!stop) {
            const g = this.gamers.draw;
            const i = this.coordObjFinder(Object.values(g), x, y, size);
            if (i != -1) {
              delete g[Object.keys(g)[i]];
              stop = true;
            }
          }
          // Фигуры
          if (!stop) {
            const coord = this.getGridCoords(x, y);
            Object.keys(this.saved_figures).forEach((k) => {
              stop = this.saved_figures[k].some(
                (v) => v.from.x === coord.x && v.from.y === coord.y
              );
              this.saved_figures[k] = this.saved_figures[k].filter((v) => {
                return !(v.from.x === coord.x && v.from.y === coord.y);
              });
            });
          }
        } else {
          // Выбор
          // Монстра
          for (const e in this.monsters.draw) {
            const i = this.coordObjFinder(this.monsters.draw[e], x, y, size);
            if (i != -1) {
              this.current_fishka = new fishka(
                this.monsters.draw[e][i],
                true,
                e
              );
              stop = true;
            }
          }
          // Игрока
          const g = this.gamers.draw;
          const values = Object.values(g);
          const i = this.coordObjFinder(values, x, y, size);
          if (i != -1) {
            this.current_fishka = new fishka(
              values[i],
              false,
              Object.keys(g)[i]
            );
            stop = true;
          }
        }
        if (this.current_fishka && !stop) {
          // Переставление фишки
          const coord = this.getGridCoords(x, y);
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

      if (this.current_figure) {
        if (!this.tmp_figure)
          this.tmp_figure = {
            from: this.getGridCoords(x, y),
          };
        else this.tmp_figure.to = { x: x, y: y };
      }
      this.gamers.addToDraw();
      this.monsters.addToDraw();
      this.refreshCanvas();
    }
  }
  @HostListener('document:mouseup', ['event'])
  canvUnclick() {
    if (
      this.type == 'Туман' &&
      this.clicked &&
      this.isMoved &&
      this.tmp_tyman
    ) {
      this.tyman.push(this.tmp_tyman!);
    }
    this.clicked = undefined;
    this.isMoved = false;
    this.tmp_tyman = undefined;
  }
  canvMove(event: MouseEvent) {
    const rect = this.canvas_rect;
    const x = event.x - rect.left;
    const y = event.clientY - rect.top;
    if (this.clicked) {
      this.isMoved = true;
      this.refreshCanvas();
    }
    let obj: monster | Gamers | undefined = this.gamers.current
      ? this.gamers
      : undefined;
    if (this.monsters.current) obj = this.monsters;
    if (obj) {
      obj.tmp = this.getGridCoords(x, y);
      this.refreshCanvas();
    }
  }
  clearTmp() {
    this.monsters.tmp = undefined;
    this.gamers.tmp = undefined;
    this.refreshCanvas();
  }
  getGridCoord(a: number, b: number) {
    const size = this.canvas_params.grid.size;
    return Math.floor((a - b) / size) * size + b + size / 2;
  }
  getGridCoords(x: number, y: number) {
    return {
      x: this.getGridCoord(x, this.canvas_params.grid.offset.x),
      y: this.getGridCoord(y, this.canvas_params.grid.offset.y),
    };
  }

  @HostListener('window:resize')
  resize() {
    const old_scale = this.scale;
    if (this.img) {
      // this.scale = Math.max(
      //   document.documentElement.offsetWidth / this.img.width,
      //   document.documentElement.offsetHeight / this.img.height
      // );
      this.scale = document.documentElement.offsetWidth / this.img.width;
    }
    this.doScale(old_scale);
    this.runWithTimeout(() => {
      this.refreshCanvas();
    });
  }

  canvasInit() {
    this.cs.newImage(this.c_image).then(() => {
      this.resize();
      this.refreshCanvas();
    });
  }

  loadJson() {
    this.http.get('pricol/' + this.c_image + '.json').subscribe((data: any) => {
      if (data.version != this.version) return;
      const vars = ['tyman', 'scale'];
      this.canvas_params.grid.size = data.gridSize;
      this.canvas_params.grid.offset.x = data.x;
      this.canvas_params.grid.offset.y = data.y;
      this.cs.line_width = data.lineWidth;
      this.draw_grid = data.grid;

      const t: any = this;
      for (const e of vars) {
        t[e] = data[e];
      }
      this.refreshCanvas();
    });
  }

  doScale(old_scale: number) {
    const scale = 1 + (this.scale - old_scale) / old_scale;

    const grid = this.canvas_params.grid;
    grid.size = grid.size * scale;
    grid.offset.x = grid.offset.x * scale;
    grid.offset.y = grid.offset.y * scale;

    const tyman_: ('h' | 'w' | 'x' | 'y')[] = ['h', 'w', 'x', 'y'];
    this.tyman = this.tyman.map((e) => {
      tyman_.forEach((k) => {
        e[k] = e[k] * scale;
      });
      return e;
    });
  }

  calcSize() {
    this.canvas_params.size.x = Math.floor(this.img.width * this.scale);
    this.canvas_params.size.y = Math.floor(this.img.height * this.scale);
    this.cdr.detectChanges();
  }
  drawRect(
    rect: tymanRect = this.tmp_tyman!,
    color: string = this.color_of_tyman
  ) {
    if (!rect) return;
    this.cs.drawFilledRect(rect, color);
  }
  refreshCanvas() {
    this.calcSize();
    this.cs.clear();
    this.cs.drawImage();
    if (this.draw_grid) this.cs.drawGrid();
    // туманы
    this.tyman.forEach((e) => {
      this.drawRect(e);
    });
    this.drawRect();
    // игроки
    this.createFishka();
    Object.keys(this.gamers.draw).forEach((c) => {
      this.createFishka(this.gamers.draw[c], c);
    });
    // монстры
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
    if (this.tmp_figure?.from) {
      this.cs.drawDot(this.tmp_figure?.from);
    }
  }
  figureChoice(
    f: string | false = this.current_figure,
    f2: figure_coord | undefined = this.tmp_figure
  ) {
    if (!f || !f2 || !f2.to) return;
    else if (f == 'circle') this.cs.drawCircleEdge(f2 as IVector2d);
    else if (f == 'rectangle') this.cs.drawRectangleEdge(f2 as IVector2d);
    else if (f == 'filter_list') this.cs.drawConusEdge(f2 as IVector2d);
  }
  createFishka(
    d: ICoords | undefined = this.current_fishka?.coord,
    color: string | undefined = this.gamers.current,
    monster = false
  ) {
    if (!d || !color) return;
    let bc = 'rgb(255, 255, 0)';
    if (this.current_fishka?.coord !== d)
      bc = !monster ? 'rgb(255, 255, 255)' : 'rgb(255, 0, 0)';
    this.cs.drawFishka(d, color, bc);
  }

  removeGamer(gamer: string) {
    delete this.gamers.draw[gamer];
    this.refreshCanvas();
  }
  delTyman(id: string) {
    this.tyman = this.tyman.filter((e) => e.id !== id);
    this.refreshCanvas();
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
    this.clearState();
    this.erase = tmp;
  }
  toggleFigure() {
    const figures: figures[] = ['filter_list', 'circle', 'rectangle'];
    let tmp = this.current_figure;
    let current = (tmp ? figures.indexOf(tmp) : -1) + 1;
    if (current == figures.length) tmp = figures[0];
    else tmp = figures[current];
    this.clearState();
    this.current_figure = tmp;
    this.refreshCanvas();
  }
  unselectFigure() {
    this.current_figure = false;
    this.tmp_figure = undefined;
  }
  clearState() {
    this.gamers.current = undefined;
    this.gamers.tmp = undefined;
    this.monsters.current = undefined;
    this.monsters.tmp = undefined;
    this.erase = false;
    this.current_figure = false;
    this.tmp_figure = undefined;
  }
  saveFigure() {
    if (this.current_figure) {
      const tmp = this.saved_figures[this.current_figure] ?? [];
      this.saved_figures[this.current_figure] = [...tmp, this.tmp_figure!];
      this.clearState();
      this.refreshCanvas();
    }
  }
}

// треугольник, круг, квадрат
type figures = 'filter_list' | 'circle' | 'rectangle';
export interface figure_coord {
  from: ICoords;
  to?: ICoords;
}
class fishki {
  constructor(all: string[]) {
    this.all = all;
  }
  all: string[];
  tmp?: ICoords;
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
  draw: { [i: string]: ICoords } = {};
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
  draw: { [i: string]: ICoords[] } = {};
  addToDraw() {
    if (this.current) {
      this.draw[this.current].push(this.tmp!);
      this.current = undefined;
      this.tmp = undefined;
    }
  }
}
class fishka {
  constructor(c: ICoords, m: boolean, col: string) {
    this.coord = c;
    this.monster = m;
    this.color = col;
  }
  coord: ICoords;
  monster: boolean;
  color: string;
}
function openFullscreen(elem = document.documentElement) {
  elem.requestFullscreen();
}
function closeFullscreen() {
  document.exitFullscreen();
}
