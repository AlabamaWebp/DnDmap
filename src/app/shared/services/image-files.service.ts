import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root',
})
export class ImageFilesService {
  constructor(private elec: ElectronService) {
    elec.fs.mkdirSync(this.path);
    this.folders = elec.fs.readdirSync(this.path);
  }
  folders!: string[];
  private path = 'C:/pricol/';
}
