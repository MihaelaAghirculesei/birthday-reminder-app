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
    const rows = birthdays.map(b => {
      const date = new Date(b.birthDate);
      const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return [
        this.escapeCSV(b.name),
        isoDate,
        this.escapeCSV(b.category || ''),
        this.escapeCSV(b.notes || ''),
        this.escapeCSV(b.zodiacSign || '')
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    this.downloadFile(blob, `birthday-backup-${this.getDateString()}.csv`);
  }

  async importFromFile(file: File): Promise<Birthday[]> {
    const text = await file.text();

    let backup: BackupData;
    try {
      backup = JSON.parse(text);
    } catch (error) {
      throw new Error('Invalid JSON file. Please select a valid backup file.');
    }

    if (!backup.birthdays || !Array.isArray(backup.birthdays)) {
      throw new Error('Invalid backup file format');
    }

    return backup.birthdays.map(b => ({
      ...b,
      birthDate: new Date(b.birthDate),
      id: b.id || crypto.randomUUID()
    }));
  }

  async importFromCSV(file: File): Promise<Birthday[]> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    const birthdays: Birthday[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length < 2) continue;

      const [name, dateStr, category, notes, zodiacSign] = values;
      const birthDate = this.parseDate(dateStr);

      if (!name || !birthDate) continue;

      birthdays.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        birthDate,
        category: category?.trim() || undefined,
        notes: notes?.trim() || undefined,
        zodiacSign: zodiacSign?.trim() || undefined
      });
    }

    if (birthdays.length === 0) {
      throw new Error('No valid birthdays found in CSV');
    }

    return birthdays;
  }

  async importFromVCard(file: File): Promise<Birthday[]> {
    const text = await file.text();
    return text.split('BEGIN:VCARD')
      .filter(v => v.includes('FN:') && v.includes('BDAY'))
      .flatMap(v => {
        const name = v.match(/FN:(.+)/)?.[1].trim();
        const bday = v.match(/BDAY[;:](.+)/)?.[1].split(':').pop()?.trim();
        const birthDate = bday ? this.parseDate(bday) : null;
        return name && birthDate ? [{ id: crypto.randomUUID(), name, birthDate, category: 'friends' }] : [];
      });
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const cleaned = dateStr.trim();

    const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      return new Date(+dmyMatch[3], +dmyMatch[2] - 1, +dmyMatch[1]);
    }

    const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]);
    }

    const parsed = new Date(cleaned);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
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
