import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../shared';

@Component({
  selector: 'app-remember-photo',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './remember-photo.component.html',
  styleUrls: ['./remember-photo.component.scss'],
})
export class RememberPhotoComponent {
  @Input() photoUrl: string | null | undefined = null;
  @Input() birthdayName: string = '';

  @Output() share = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();
  @Output() copyToClipboard = new EventEmitter<void>();

  onShare(): void {
    this.share.emit();
  }

  onDownload(): void {
    this.download.emit();
  }

  getTooltip(): string {
    return 'Remember Photo - Click: Download | Double-click: Share';
  }
}
