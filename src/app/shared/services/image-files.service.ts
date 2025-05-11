import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root',
})
export class ImageFilesService {
  constructor(private elec: ElectronService) {
    elec.fs.mkdirSync(this.path, { recursive: true });
    this.folders = elec.fs.readdirSync(this.path);
  }
  saveImage(image: string, name: string) {
    
  }
  folders!: string[];
  public path = 'C:/pricol/'; // Путь для сохранения изображений
}
