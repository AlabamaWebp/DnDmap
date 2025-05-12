import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root',
})
export class ImageFilesService {
  constructor(private elec: ElectronService) {
    this.folders = elec.fs.readdirSync(this.path);
    console.log(this.path, this.folders);
    
    // elec.fs.mkdirSync(this.path, { recursive: true });
    const types = ['jpg', 'jpeg', 'png', 'webp'];
    this.images = this.folders.filter((e) => types.some((t) => e.includes(t)));
    this.jsons = this.folders.filter((e) => e.includes('json'));
    console.log(this.jsons, this.images);
  }
  saveImage(image: string, name: string) {}
  images!: string[];
  jsons!: string[];
  folders!: string[];
  // public path = this.elec.platform == "win32" ?  'C:/pricol/' : "~/pricol"; // Путь для сохранения изображений
  public path = this.elec.path.join(((window as any).process.env.HOME || (window as any).process.env.USERPROFILE), "pricol/"); // Путь для сохранения изображений
}
