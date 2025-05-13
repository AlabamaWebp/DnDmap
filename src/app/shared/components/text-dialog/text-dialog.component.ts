import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-text-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './text-dialog.component.html',
  styleUrl: './text-dialog.component.scss',
})
export class TextDialogComponent {
  inputValue: string = '';

  constructor(private dialogRef: MatDialogRef<TextDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onAccept(): void {
    this.dialogRef.close(this.inputValue);
  }
}
