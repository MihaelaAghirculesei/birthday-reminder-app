import { TestBed } from '@angular/core/testing';
import { IndexedDBStorageService } from './offline-storage.service';
import { Birthday } from '../../shared';

describe('IndexedDBStorageService', () => {
  let service: IndexedDBStorageService;

  const mockBirthday: Birthday = {
    id: 'test-1',
    name: 'John Doe',
    birthDate: new Date('1990-01-15'),
    zodiacSign: 'Capricorn',
    reminderDays: 7,
    category: 'family'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IndexedDBStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get birthdays without errors', async () => {
    const birthdays = await service.getBirthdays();
    expect(Array.isArray(birthdays)).toBe(true);
  });

  it('should save birthdays without errors', async () => {
    await expectAsync(service.saveBirthdays([mockBirthday])).toBeResolved();
  });

  it('should add birthday without errors', async () => {
    await expectAsync(service.addBirthday(mockBirthday)).toBeResolved();
  });

  it('should update birthday without errors', async () => {
    await expectAsync(service.updateBirthday(mockBirthday)).toBeResolved();
  });

  it('should delete birthday without errors', async () => {
    await expectAsync(service.deleteBirthday('test-1')).toBeResolved();
  });

  it('should clear all data without errors', async () => {
    await expectAsync(service.clear()).toBeResolved();
  });
});
