import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { BirthdayFacadeService } from './birthday-facade.service';
import * as BirthdayActions from '../store/birthday/birthday.actions';

describe('BirthdayFacadeService', () => {
  let service: BirthdayFacadeService;
  let store: jasmine.SpyObj<Store>;

  beforeEach(() => {
    const storeSpy = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    storeSpy.select.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        BirthdayFacadeService,
        { provide: Store, useValue: storeSpy }
      ]
    });

    service = TestBed.inject(BirthdayFacadeService);
    store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should dispatch loadBirthdays on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(BirthdayActions.loadBirthdays());
  });

  it('should dispatch addBirthday action', () => {
    const birthday = { name: 'Test', birthDate: new Date(), zodiacSign: 'Aries', reminderDays: 7, category: 'family' };
    service.addBirthday(birthday);
    expect(store.dispatch).toHaveBeenCalledWith(BirthdayActions.addBirthday({ birthday }));
  });

  it('should dispatch updateBirthday action', () => {
    const birthday = { id: '1', name: 'Test', birthDate: new Date(), zodiacSign: 'Aries', reminderDays: 7, category: 'family' };
    service.updateBirthday(birthday);
    expect(store.dispatch).toHaveBeenCalledWith(BirthdayActions.updateBirthday({ birthday }));
  });

  it('should dispatch deleteBirthday action', () => {
    service.deleteBirthday('test-id');
    expect(store.dispatch).toHaveBeenCalledWith(BirthdayActions.deleteBirthday({ id: 'test-id' }));
  });

  it('should dispatch clearAllBirthdays action', () => {
    service.clearAllBirthdays();
    expect(store.dispatch).toHaveBeenCalledWith(BirthdayActions.clearAllBirthdays());
  });

  it('should dispatch setSearchTerm action', () => {
    service.setSearchTerm('test');
    expect(store.dispatch).toHaveBeenCalledWith(BirthdayActions.setSearchTerm({ searchTerm: 'test' }));
  });

  it('should dispatch setSelectedMonth action', () => {
    service.setSelectedMonth(5);
    expect(store.dispatch).toHaveBeenCalledWith(BirthdayActions.setSelectedMonth({ month: 5 }));
  });

  it('should dispatch clearFilters action', () => {
    service.clearFilters();
    expect(store.dispatch).toHaveBeenCalledWith(BirthdayActions.clearFilters());
  });

  it('should expose birthdays$ observable', (done) => {
    service.birthdays$.subscribe(birthdays => {
      expect(birthdays).toEqual([]);
      done();
    });
  });
});
