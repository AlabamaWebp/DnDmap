import { Component } from '@angular/core';
import { ImageFilesService } from '../../shared/services/image-files.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TextDialogComponent } from '../../shared/components/text-dialog/text-dialog.component';
import { ElectronService } from '../../shared/services/electron.service';

@Component({
  selector: 'app-menu',
  imports: [MatButtonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  constructor(public files: ImageFilesService, private dialog: MatDialog,) { }
  current = -1;
  company?: string;

  createCompany() {
    this.dialog
      .open(TextDialogComponent)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.files.createFolder(result);
        }
      });
  }
  deleteC() {
    this.files.deleteCompany(this.files.folders[this.current]);
    this.current = -1;
  }
  toedit(c: string) {
    this.company = c;
  }
  tocompany() {
    this.company = undefined
  }


  // images = this.files.images.map(e => "file://" + this.files.path.replaceAll("\\",'/') + e);
}
