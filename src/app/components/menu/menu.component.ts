import { Component } from '@angular/core';
import { ImageFilesService } from '../../shared/services/image-files.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TextDialogComponent } from '../../shared/components/text-dialog/text-dialog.component';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-menu',
  imports: [MatButtonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  constructor(public files: ImageFilesService, private dialog: MatDialog, private router: Router) { }
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
  get folder() {
    return this.files.folders[this.current]
  }
  deleteC() {
    this.files.deleteCompany(this.folder);
    this.current = -1;
  }
  toedit() {
    this.company = this.folder;
    this.current = -1;
    this.files.getFolder(this.company);
  }
  tocompany() {
    this.company = undefined
  }


  createLocation() {
    this.dialog
    .open(TextDialogComponent)
    .afterClosed()
    .subscribe((result) => {
      if (result) {
        this.files.addImage(this.company!, result);
      }
    });
  }
  deleteL() {
    this.files.delLocation(this.company!, this.files.images[this.current]);
    this.files.getFolder(this.company!)
  }
  toCreate() {
    this.files.goToLocation(this.company!, this.files.images[this.current])
  }

  goBack() {
    this.company = undefined;
    this.current = -1;
  }

  export() {
    this.files.export(this.folder)
  }


  // images = this.files.images.map(e => "file://" + this.files.path.replaceAll("\\",'/') + e);
}
