import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

@Component({
  selector: 'photo-upload',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="photo-upload-container">
      <div class="photo-preview" 
           [class.has-photo]="currentPhoto"
           (click)="triggerFileInput()">
        
        <!-- Photo Preview -->
        <div *ngIf="currentPhoto" class="photo-display">
          <img [src]="currentPhoto" alt="Contact photo" class="contact-photo">
          <div class="photo-overlay">
            <mat-icon>edit</mat-icon>
            <span>Change Photo</span>
          </div>
        </div>
        
        <!-- Upload Placeholder -->
        <div *ngIf="!currentPhoto" class="photo-placeholder">
          <mat-icon class="upload-icon">add_a_photo</mat-icon>
          <span class="upload-text">Add Photo</span>
          <small class="upload-hint">Click to upload image</small>
        </div>
        
        <!-- Hidden File Input -->
        <input
          #fileInput
          type="file"
          accept="image/*"
          (change)="onFileSelected($event)"
          style="display: none;">
      </div>
      
      <!-- Remove Button -->
      <button *ngIf="currentPhoto" 
              mat-icon-button 
              color="warn" 
              class="remove-photo-btn"
              (click)="removePhoto($event)"
              matTooltip="Remove photo">
        <mat-icon>delete</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .photo-upload-container {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .photo-preview {
      width: 120px;
      height: 120px;
      border: 3px dashed var(--border);
      border-radius: var(--radius);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      position: relative;
      background: var(--surface-elevated);
      
      &:hover {
        border-color: var(--primary);
        transform: scale(1.02);
        box-shadow: var(--shadow);
      }
      
      &.has-photo {
        border: 3px solid var(--primary);
        
        &:hover .photo-overlay {
          opacity: 1;
        }
      }
    }
    
    .photo-display {
      width: 100%;
      height: 100%;
      position: relative;
      
      .contact-photo {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: calc(var(--radius) - 3px);
      }
      
      .photo-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: calc(var(--radius) - 3px);
        color: white;
        
        mat-icon {
          font-size: 2rem;
          width: 2rem;
          height: 2rem;
          margin-bottom: 4px;
        }
        
        span {
          font-size: 0.75rem;
          font-weight: 600;
          text-align: center;
        }
      }
    }
    
    .photo-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 16px;
      text-align: center;
      
      .upload-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
        color: var(--text-muted);
        margin-bottom: 8px;
        background: var(--primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .upload-text {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9rem;
        margin-bottom: 4px;
        display: block;
      }
      
      .upload-hint {
        color: var(--text-muted);
        font-size: 0.75rem;
        line-height: 1.2;
      }
    }
    
    .remove-photo-btn {
      flex-shrink: 0;
      width: 36px !important;
      height: 36px !important;
      background: var(--warning) !important;
      color: white !important;
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(252, 70, 107, 0.4);
      }
    }
    
    // Responsive
    @media (max-width: 768px) {
      .photo-upload-container {
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
      
      .photo-preview {
        width: 100px;
        height: 100px;
      }
    }
  `]
})
export class PhotoUploadComponent {
  @Input() currentPhoto: string | null = null;
  @Output() photoSelected = new EventEmitter<string>();
  @Output() photoRemoved = new EventEmitter<void>();

  triggerFileInput() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        this.photoSelected.emit(base64String);
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(event: Event) {
    event.stopPropagation();
    this.photoRemoved.emit();
  }
}