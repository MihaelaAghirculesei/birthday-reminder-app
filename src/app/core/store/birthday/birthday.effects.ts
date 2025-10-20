import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, mergeMap, tap } from 'rxjs/operators';
import * as BirthdayActions from './birthday.actions';
import { IndexedDBStorageService } from '../../services/offline-storage.service';
import { NotificationService } from '../../services/notification.service';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { Birthday } from '../../../shared/models/birthday.model';
import { getZodiacSign, DEFAULT_CATEGORY } from '../../../shared';

@Injectable()
export class BirthdayEffects {

  loadBirthdays$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BirthdayActions.loadBirthdays),
      mergeMap(() =>
        this.offlineStorage.getBirthdays().then(birthdays => {
          return birthdays.map(b => ({
            ...b,
            zodiacSign: b.zodiacSign || getZodiacSign(b.birthDate).name
          }));
        }).then(birthdays =>
          BirthdayActions.loadBirthdaysSuccess({ birthdays })
        ).catch(error =>
          BirthdayActions.loadBirthdaysFailure({ error: error.message })
        )
      )
    )
  );

  addBirthday$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BirthdayActions.addBirthday),
      mergeMap(({ birthday }) => {
        const newBirthday: Birthday = {
          ...birthday,
          id: this.generateId(),
          category: birthday.category || DEFAULT_CATEGORY,
          zodiacSign: birthday.zodiacSign || getZodiacSign(birthday.birthDate).name
        };

        return this.syncToGoogleCalendar(newBirthday).then(eventId => {
          if (eventId) {
            newBirthday.googleCalendarEventId = eventId;
          }
          return newBirthday;
        }).then(finalBirthday =>
          this.offlineStorage.addBirthday(finalBirthday).then(() => finalBirthday)
        ).then(finalBirthday =>
          BirthdayActions.addBirthdaySuccess({ birthday: finalBirthday })
        ).catch(error =>
          BirthdayActions.addBirthdayFailure({ error: error.message })
        );
      })
    )
  );

  addBirthdaySuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BirthdayActions.addBirthdaySuccess),
        tap(({ birthday }) => {
          this.notificationService.show(`${birthday.name} added successfully!`, 'success');
        })
      ),
    { dispatch: false }
  );

  updateBirthday$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BirthdayActions.updateBirthday),
      mergeMap(({ birthday }) =>
        this.updateGoogleCalendar(birthday).then(() =>
          this.offlineStorage.updateBirthday(birthday)
        ).then(() =>
          BirthdayActions.updateBirthdaySuccess({ birthday })
        ).catch(error =>
          BirthdayActions.updateBirthdayFailure({ error: error.message })
        )
      )
    )
  );

  updateBirthdaySuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BirthdayActions.updateBirthdaySuccess),
        tap(({ birthday }) => {
          this.notificationService.show(`${birthday.name} updated successfully!`, 'success');
        })
      ),
    { dispatch: false }
  );

  deleteBirthday$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BirthdayActions.deleteBirthday),
      mergeMap(({ id }) =>
        this.offlineStorage.getBirthdays().then(birthdays => {
          const birthday = birthdays.find(b => b.id === id);
          return birthday;
        }).then(birthday => {
          if (birthday?.googleCalendarEventId) {
            return this.deleteFromGoogleCalendar(birthday.googleCalendarEventId).then(() => id);
          }
          return id;
        }).then(birthdayId =>
          this.offlineStorage.deleteBirthday(birthdayId)
        ).then(() =>
          BirthdayActions.deleteBirthdaySuccess({ id })
        ).catch(error =>
          BirthdayActions.deleteBirthdayFailure({ error: error.message })
        )
      )
    )
  );

  deleteBirthdaySuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BirthdayActions.deleteBirthdaySuccess),
        tap(() => {
          this.notificationService.show('Birthday deleted successfully!', 'success');
        })
      ),
    { dispatch: false }
  );

  clearAllBirthdays$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BirthdayActions.clearAllBirthdays),
      mergeMap(() =>
        this.offlineStorage.clear().then(() =>
          BirthdayActions.clearAllBirthdaysSuccess()
        ).catch(error =>
          BirthdayActions.clearAllBirthdaysFailure({ error: error.message })
        )
      )
    )
  );

  addMessageToBirthday$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BirthdayActions.addMessageToBirthday),
      map(({ birthdayId, message }) =>
        BirthdayActions.addMessageToBirthdaySuccess({ birthdayId, message })
      )
    )
  );

  updateMessageInBirthday$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BirthdayActions.updateMessageInBirthday),
      map(({ birthdayId, messageId, updates }) =>
        BirthdayActions.updateMessageInBirthdaySuccess({ birthdayId, messageId, updates })
      )
    )
  );

  deleteMessageFromBirthday$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BirthdayActions.deleteMessageFromBirthday),
      map(({ birthdayId, messageId }) =>
        BirthdayActions.deleteMessageFromBirthdaySuccess({ birthdayId, messageId })
      )
    )
  );

  loadTestData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BirthdayActions.loadTestData),
      mergeMap(() => {
        const testBirthdays = this.generateTestData();

        // Dispatch addBirthday action for each test birthday
        // This reuses existing logic for saving to IndexedDB and Google Calendar
        const addActions = testBirthdays.map(birthday =>
          BirthdayActions.addBirthday({ birthday })
        );

        // Return success action after dispatching all add actions
        return [
          ...addActions,
          BirthdayActions.loadTestDataSuccess({ birthdays: testBirthdays })
        ];
      }),
      catchError(error => of(BirthdayActions.loadTestDataFailure({ error: error.message })))
    )
  );

  loadTestDataSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BirthdayActions.loadTestDataSuccess),
        tap(({ birthdays }) => {
          this.notificationService.show(`${birthdays.length} test birthdays loaded successfully!`, 'success');
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private offlineStorage: IndexedDBStorageService,
    private notificationService: NotificationService,
    private googleCalendarService: GoogleCalendarService
  ) {}

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  private generateTestData(): Birthday[] {
    const testNames = [
      { name: 'Alice Johnson', date: new Date(1990, 2, 15), category: 'Family' },
      { name: 'Bob Smith', date: new Date(1985, 5, 22), category: 'Friends' },
      { name: 'Charlie Brown', date: new Date(1992, 8, 10), category: 'Work' },
      { name: 'Diana Prince', date: new Date(1988, 11, 5), category: 'Friends' },
      { name: 'Edward Norton', date: new Date(1995, 1, 28), category: 'Family' },
      { name: 'Fiona Apple', date: new Date(1987, 6, 18), category: 'Other' },
      { name: 'George Martin', date: new Date(1993, 9, 3), category: 'Work' },
      { name: 'Hannah Montana', date: new Date(1991, 3, 12), category: 'Friends' }
    ];

    return testNames.map(({ name, date, category }) => ({
      id: this.generateId(),
      name,
      birthDate: date,
      zodiacSign: getZodiacSign(date).name,
      reminderDays: 7,
      category,
      notes: `Test birthday for ${name}`,
      scheduledMessages: []
    })) as Birthday[];
  }

  private async syncToGoogleCalendar(birthday: Birthday): Promise<string | null> {
    if (this.googleCalendarService.isEnabled()) {
      try {
        return await this.googleCalendarService.syncBirthdayToCalendar(birthday);
      } catch (error) {
        // Silent failure for Google Calendar sync
        return null;
      }
    }
    return null;
  }

  private async updateGoogleCalendar(birthday: Birthday): Promise<void> {
    if (birthday.googleCalendarEventId && this.googleCalendarService.isEnabled()) {
      try {
        await this.googleCalendarService.updateBirthdayInCalendar(birthday, birthday.googleCalendarEventId);
      } catch (error) {
        // Silent failure for Google Calendar sync
      }
    }
  }

  private async deleteFromGoogleCalendar(eventId: string): Promise<void> {
    if (this.googleCalendarService.isEnabled()) {
      try {
        await this.googleCalendarService.deleteBirthdayFromCalendar(eventId);
      } catch (error) {
        // Silent failure for Google Calendar sync
      }
    }
  }
}
