import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, fromEvent, merge, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService implements OnDestroy {
  private onlineSubject = new BehaviorSubject<boolean>(true);
  public online$ = this.onlineSubject.asObservable();
  private networkSubscription?: Subscription;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      this.onlineSubject.next(navigator.onLine);
      this.initializeNetworkListener();
    }
  }

  ngOnDestroy(): void {
    if (this.networkSubscription) {
      this.networkSubscription.unsubscribe();
    }
  }

  private initializeNetworkListener(): void {
    if (typeof window !== 'undefined' && window.navigator) {
      const online$ = fromEvent(window, 'online').pipe(map(() => true));
      const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

      this.networkSubscription = merge(online$, offline$).subscribe((isOnline: boolean) => {
        this.onlineSubject.next(isOnline);
      });
    }
  }

  get isOnline(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return this.onlineSubject.value;
    }
    return true;
  }

  get isOffline(): boolean {
    return !this.isOnline;
  }
}