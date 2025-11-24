import { Injectable } from '@angular/core';
import { Birthday } from '../../shared';

export interface BackupData {
  version: number;
  exportDate: string;
  birthdays: Birthday[];
}

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private readonly BACKUP_VERSION = 1;

  exportToJSON(birthdays: Birthday[]): void {
    const backup: BackupData = {
      version: this.BACKUP_VERSION,
      exportDate: new Date().toISOString(),
      birthdays
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    this.downloadFile(blob, `birthday-backup-${this.getDateString()}.json`);
  }

  exportToCSV(birthdays: Birthday[]): void {
    const headers = ['Name', 'Birth Date', 'Category', 'Notes', 'Zodiac Sign'];
    const rows = birthdays.map(b => [
      this.escapeCSV(b.name),
      new Date(b.birthDate).toLocaleDateString(),
      this.escapeCSV(b.category || ''),
      this.escapeCSV(b.notes || ''),
      this.escapeCSV(b.zodiacSign || '')
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    this.downloadFile(blob, `birthday-backup-${this.getDateString()}.csv`);
  }

  async importFromFile(file: File): Promise<Birthday[]> {
    const text = await file.text();
    const backup: BackupData = JSON.parse(text);

    if (!backup.birthdays || !Array.isArray(backup.birthdays)) {
      throw new Error('Invalid backup file format');
    }

    return backup.birthdays.map(b => ({
      ...b,
      birthDate: new Date(b.birthDate),
      id: b.id || crypto.randomUUID()
    }));
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
