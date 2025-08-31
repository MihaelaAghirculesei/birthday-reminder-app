import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineSubject = new BehaviorSubject<boolean>(true);
  public online$ = this.onlineSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.onlineSubject.next(navigator.onLine);
      this.initializeNetworkListener();
    }
  }

  private initializeNetworkListener(): void {
    if (typeof window !== 'undefined' && window.navigator) {
      const online$ = fromEvent(window, 'online').pipe(map(() => true));
      const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
      
      merge(online$, offline$).subscribe((isOnline: boolean) => {
        this.onlineSubject.next(isOnline);
      });
    }
  }

  get isOnline(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return this.onlineSubject.value;
    }
    return true; // Assume online on server
  }

  get isOffline(): boolean {
    return !this.isOnline;
  }
}