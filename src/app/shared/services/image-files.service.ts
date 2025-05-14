import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root',
})
export class ImageFilesService {
  constructor(private elec: ElectronService) {
    this.refreshFolders()
    elec.fs.mkdirSync(this.path, { recursive: true });
    console.log(this.jsons, this.images);
  }
  refreshFolders() {
    this.folders = this.elec.fs
      .readdirSync(this.path, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  }
  getFolder(folder: string) {
    const data = this.elec.fs.readdirSync(
      this.elec.path.join(this.path, folder)
    );
    const types = ['jpg', 'jpeg', 'png', 'webp'];
    this.images = data.filter((e) => types.some((t) => e.includes(t)));
    this.jsons = data.filter((e) => e.includes('json'));
  }
  createFolder(name: string) {
    this.elec.fs.mkdirSync(this.elec.path.join(this.path, name));
    this.refreshFolders();
  }
  deleteCompany(company: string) {
    this.elec.fs.rmdir(this.elec.path.join(this.path, company), { recursive: true }, (err) => {
      if (err) throw err;
      console.log('Папка и все вложенные файлы удалены');
      this.refreshFolders();
    });
  }
  saveImage(image: string, name: string) { }
  images!: string[];
  jsons!: string[];
  folders!: string[];
  // public path = this.elec.platform == "win32" ?  'C:/pricol/' : "~/pricol"; // Путь для сохранения изображений
  public path = this.elec.path.join(
    (window as any).process.env.HOME || (window as any).process.env.USERPROFILE,
    'pricol/'
  ); // Путь для сохранения изображений
}
