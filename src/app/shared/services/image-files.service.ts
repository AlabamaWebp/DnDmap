import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ImageFilesService {
  constructor(private elec: ElectronService, private router: Router) {
    this.refreshFolders();
    elec.fs.mkdirSync(this.path, { recursive: true });
    console.log(this.jsons, this.images);
  }
  refreshFolders() {
    try {
      this.folders = this.elec.fs
        .readdirSync(this.path, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    } catch {
      this.folders = [];
    }
  }
  getFolder(folder: string) {
    const data = this.elec.fs.readdirSync(this.plib(this.path, folder));
    // const types = ['jpg', 'jpeg', 'png', 'webp'];
    // this.images = data.filter((e) => types.some((t) => e.includes(t)));
    this.jsons = data.filter((e) => e.includes('.json'));
    this.images = data.filter((e) => !e.includes('.json'));
  }
  createFolder(name: string) {
    this.elec.fs.mkdirSync(this.plib(this.path, name));
    this.refreshFolders();
  }
  deleteCompany(company: string) {
    this.elec.fs.rmdir(
      this.plib(this.path, company),
      { recursive: true },
      (err) => {
        if (err) throw err;
        console.log('Папка и все вложенные файлы удалены');
        this.refreshFolders();
      }
    );
  }
  saveImage(image: string, name: string) {}
  images!: string[];
  jsons!: string[];
  folders!: string[];
  // public path = this.elec.platform == "win32" ?  'C:/pricol/' : "~/pricol"; // Путь для сохранения изображений
  plib = this.elec.path.join;
  public path = this.plib(
    (window as any).process.env.HOME || (window as any).process.env.USERPROFILE,
    'pricol/'
  ); // Путь для сохранения изображений

  c_location?: string;
  c_comp?: string;
  addImage(compmany: string, name: string) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (event: Event) =>
      this.onFileSelected(event, compmany, name);
    fileInput.click();
    fileInput.remove();
  }

  async onFileSelected(event: Event, compmany: string, name: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      this.saveImagePath(name, Buffer.from(await file.arrayBuffer()), compmany);
    }
  }

  async saveImagePath(fileName: string, file: Buffer, compmany: string) {
    // const fullPath = this.plib(this.path, compmany, this.images.length + "." + fileName.split(".").at(-1)!);

    const fullPath = this.plib(this.path, compmany, fileName);
    console.log(fullPath);
    this.elec.fs.writeFileSync(fullPath, file);
    this.getFolder(compmany);
    this.goToLocation(compmany, fileName);
  }

  goToLocation(company: string, location: string) {
    this.c_location = location;
    this.c_comp = company;
    this.router.navigate(['create']);
  }
  delLocation(company: string, location: string) {
    let d = this.plib(this.path, company, location);
    if (this.elec.fs.existsSync(d)) this.elec.fs.rmSync(d);
    d += '.json';
    if (this.elec.fs.existsSync(d)) this.elec.fs.rmSync(d);
  }
  export(c: string) {
    const p = this.plib(window.process.cwd(), 'src', 'pricol');
    this.elec.fs.mkdirSync(p, { recursive: true });
    this.elec.fs.cpSync(this.path + c, p, { recursive: true });
    this.getFolder(c);
    this.elec.fs.writeFileSync(
      this.plib(p, 'gamedata.json'),
      JSON.stringify(this.images)
    );
  }
}
