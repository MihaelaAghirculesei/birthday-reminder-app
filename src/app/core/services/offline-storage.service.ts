import { Injectable } from '@angular/core';
import { Birthday, ScheduledMessage } from '../../shared';

interface StoredBirthday extends Omit<Birthday, 'birthDate'> {
  birthDate: string;
}

export interface OfflineStorageService {
  getBirthdays(): Promise<Birthday[]>;
  saveBirthdays(birthdays: Birthday[]): Promise<void>;
  addBirthday(birthday: Birthday): Promise<void>;
  updateBirthday(birthday: Birthday): Promise<void>;
  deleteBirthday(id: string): Promise<void>;
  clear(): Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDBStorageService implements OfflineStorageService {
  private dbName = 'BirthdayReminderDB';
  private dbVersion = 2;
  private storeName = 'birthdays';
  private messagesStoreName = 'scheduledMessages';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('birthDate', 'birthDate', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.messagesStoreName)) {
          const messageStore = db.createObjectStore(this.messagesStoreName, { keyPath: 'id' });
          messageStore.createIndex('birthdayId', 'birthdayId', { unique: false });
          messageStore.createIndex('active', 'active', { unique: false });
        }
      };
    });
  }

  async getBirthdays(): Promise<Birthday[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const birthdays = request.result.map((b: StoredBirthday) => ({
            ...b,
            birthDate: new Date(b.birthDate)
          }));
          resolve(birthdays);
        };
      });
    } catch (error) {
      return [];
    }
  }

  async saveBirthdays(birthdays: Birthday[]): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        store.clear();

        birthdays.forEach(birthday => {
          store.add({
            ...birthday,
            birthDate: birthday.birthDate.toISOString()
          });
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      throw error;
    }
  }

  async addBirthday(birthday: Birthday): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.add({
          ...birthday,
          birthDate: birthday.birthDate.toISOString()
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      throw error;
    }
  }

  async updateBirthday(birthday: Birthday): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put({
          ...birthday,
          birthDate: birthday.birthDate.toISOString()
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteBirthday(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      throw error;
    }
  }

  async saveScheduledMessage(message: ScheduledMessage): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.messagesStoreName], 'readwrite');
        const store = transaction.objectStore(this.messagesStoreName);
        const request = store.add(message);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      throw error;
    }
  }

  async updateScheduledMessage(message: ScheduledMessage): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.messagesStoreName], 'readwrite');
        const store = transaction.objectStore(this.messagesStoreName);
        const request = store.put(message);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteScheduledMessage(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.messagesStoreName], 'readwrite');
        const store = transaction.objectStore(this.messagesStoreName);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      throw error;
    }
  }

  async getScheduledMessagesByBirthday(birthdayId: string): Promise<ScheduledMessage[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.messagesStoreName], 'readonly');
        const store = transaction.objectStore(this.messagesStoreName);
        const index = store.index('birthdayId');
        const request = index.getAll(birthdayId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
      });
    } catch (error) {
      return [];
    }
  }
}