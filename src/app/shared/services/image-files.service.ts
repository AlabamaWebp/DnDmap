import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root',
})
export class ImageFilesService {
  constructor(private elec: ElectronService) {
    elec.fs.mkdirSync(this.path, { recursive: true });
    this.folders = elec.fs.readdirSync(this.path);
    const types = ['jpg', 'jpeg', 'png', 'webp'];
    this.images = this.folders.filter((e) => types.some((t) => e.includes(t)));
    this.jsons = this.folders.filter((e) => e.includes('json'));
    console.log(this.jsons, this.images);
  }
  saveImage(image: string, name: string) {}
  images!: string[];
  jsons!: string[];
  folders!: string[];
  public path = 'C:/pricol/'; // Путь для сохранения изображений
}
