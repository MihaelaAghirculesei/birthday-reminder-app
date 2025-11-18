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
            zodiacSign: b.zodiacSign || getZodiacSign(b.birthDate).name,
            category: this.normalizeCategoryId(b.category)
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
          category: this.normalizeCategoryId(birthday.category || DEFAULT_CATEGORY),
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
      mergeMap(({ birthday }) => {
        const normalizedBirthday: Birthday = {
          ...birthday,
          category: this.normalizeCategoryId(birthday.category)
        };
        return this.updateGoogleCalendar(normalizedBirthday).then(() =>
          this.offlineStorage.updateBirthday(normalizedBirthday)
        ).then(() =>
          BirthdayActions.updateBirthdaySuccess({ birthday: normalizedBirthday })
        ).catch(error =>
          BirthdayActions.updateBirthdayFailure({ error: error.message })
        );
      })
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

        const addActions = testBirthdays.map(birthday =>
          BirthdayActions.addBirthday({ birthday })
        );

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
      { name: 'Uwe Müller', date: new Date(1990, 2, 15), category: 'family', photo: 'https://i.pravatar.cc/200?img=1' },
      { name: 'Bob Smith', date: new Date(1985, 5, 22), category: 'friends', photo: 'https://i.pravatar.cc/200?img=12' },
      { name: 'Charlie Brown', date: new Date(1992, 8, 10), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=13' },
      { name: 'Diana Prince', date: new Date(1988, 11, 5), category: 'friends', photo: 'https://i.pravatar.cc/200?img=5' },
      { name: 'Edward Norton', date: new Date(1995, 1, 28), category: 'family', photo: 'https://i.pravatar.cc/200?img=14' },
      { name: 'Fiona Apple', date: new Date(1987, 6, 18), category: 'romantic', photo: 'https://i.pravatar.cc/200?img=9' },
      { name: 'George Martin', date: new Date(1993, 9, 3), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=15' },
      { name: 'Hannah Montana', date: new Date(1991, 3, 12), category: 'friends', photo: 'https://i.pravatar.cc/200?img=10' },
      { name: 'Isabella Garcia', date: new Date(1994, 0, 8), category: 'family', photo: 'https://i.pravatar.cc/200?img=16' },
      { name: 'Jack Thompson', date: new Date(1989, 4, 19), category: 'acquaintances', photo: 'https://i.pravatar.cc/200?img=17' },
      { name: 'Katherine Lee', date: new Date(1996, 7, 25), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=20' },
      { name: 'Liam O\'Connor', date: new Date(1986, 10, 14), category: 'friends', photo: 'https://i.pravatar.cc/200?img=33' },
      { name: 'Maya Patel', date: new Date(1993, 2, 30), category: 'family', photo: 'https://i.pravatar.cc/200?img=21' },
      { name: 'Olivia Martinez', date: new Date(1997, 9, 21), category: 'friends', photo: 'https://i.pravatar.cc/200?img=47' },
      { name: 'Patrick Anderson', date: new Date(1984, 1, 16), category: 'acquaintances', photo: null },
      { name: 'Quinn Roberts', date: new Date(1992, 6, 11), category: 'family', photo: 'https://i.pravatar.cc/200?img=23' },
      { name: 'Rachel Green', date: new Date(1990, 8, 4), category: 'friends', photo: 'https://i.pravatar.cc/200?img=24' },
      { name: 'Hanna Gau', date: new Date(1988, 3, 29), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=25' },
      { name: 'Tiffany Chen', date: new Date(1995, 11, 23), category: 'friends', photo: 'https://i.pravatar.cc/200?img=26' },
      { name: 'Ulysses Grant', date: new Date(1987, 0, 17), category: 'other', photo: null },
      { name: 'Vanessa Lopez', date: new Date(1994, 4, 9), category: 'family', photo: 'https://i.pravatar.cc/200?img=27' },
      { name: 'Julia Davis', date: new Date(1989, 7, 13), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=28' },
      { name: 'Anna Wilson', date: new Date(1996, 10, 27), category: 'friends', photo: 'https://i.pravatar.cc/200?img=29' },
      { name: 'Yasmin Ahmed', date: new Date(1985, 2, 6), category: 'family', photo: 'https://i.pravatar.cc/200?img=30' },
      { name: 'Sophia Moore', date: new Date(1993, 5, 20), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=31' },
      { name: 'Amelia Clark', date: new Date(1991, 8, 15), category: 'friends', photo: 'https://i.pravatar.cc/200?img=32' },
      { name: 'Benjamin Harris', date: new Date(1988, 1, 2), category: 'acquaintances', photo: null },
      { name: 'Chloe Walker', date: new Date(1997, 4, 24), category: 'family', photo: 'https://i.pravatar.cc/200?img=34' },
      { name: 'Daniela Young', date: new Date(1986, 7, 8), category: 'romantic', photo: 'https://i.pravatar.cc/200?img=35' },
      { name: 'Emily Turner', date: new Date(1994, 10, 18), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=36' },
      { name: 'Chloe Rodriguez', date: new Date(1992, 2, 12), category: 'friends', photo: 'https://i.pravatar.cc/200?img=37' },
      { name: 'Grace Mitchell', date: new Date(1990, 5, 26), category: 'family', photo: 'https://i.pravatar.cc/200?img=38' },
      { name: 'Henry Phillips', date: new Date(1987, 9, 1), category: 'other', photo: null },
      { name: 'Iris Campbell', date: new Date(1995, 1, 14), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=48' },
      { name: 'Jessica Parker', date: new Date(1989, 6, 31), category: 'friends', photo: 'https://i.pravatar.cc/200?img=40' },
      { name: 'Kylie Evans', date: new Date(1996, 3, 5), category: 'family', photo: 'https://i.pravatar.cc/200?img=41' },
      { name: 'Lena Collins', date: new Date(1984, 8, 22), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=42' },
      { name: 'Mia Stewart', date: new Date(1993, 11, 10), category: 'friends', photo: 'https://i.pravatar.cc/200?img=43' },
      { name: 'Noah Morris', date: new Date(1991, 0, 28), category: 'acquaintances', photo: 'https://i.pravatar.cc/200?img=51' },
      { name: 'Penelope Cox', date: new Date(1988, 4, 16), category: 'family', photo: 'https://i.pravatar.cc/200?img=44' },
      { name: 'Roberta Bailey', date: new Date(1997, 7, 3), category: 'friends', photo: 'https://i.pravatar.cc/200?img=45' },
      { name: 'Marcus "Ninja" Johnson', date: new Date(1995, 5, 14), category: 'gaming', photo: 'https://i.pravatar.cc/200?img=52' },
      { name: 'Sarah "GamerGirl" Lee', date: new Date(1998, 8, 22), category: 'gaming', photo: 'https://i.pravatar.cc/200?img=46' },
      { name: 'Alex "ProPlayer" Chen', date: new Date(1992, 11, 8), category: 'gaming', photo: 'https://i.pravatar.cc/200?img=53' },
      { name: 'Tyler "Speedrunner" Walsh', date: new Date(1996, 3, 18), category: 'gaming', photo: 'https://i.pravatar.cc/200?img=54' }
    ];

    return testNames.map(({ name, date, category, photo }) => ({
      id: this.generateId(),
      name,
      birthDate: date,
      zodiacSign: getZodiacSign(date).name,
      reminderDays: 7,
      category,
      notes: `Test birthday for ${name}`,
      photo: photo || this.generateAvatarUrl(name),
      scheduledMessages: []
    })) as Birthday[];
  }

  private generateAvatarUrl(name: string): string {
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&size=200&background=random&color=fff&bold=true`;
  }

  private normalizeCategoryId(category?: string): string {
    if (!category) return DEFAULT_CATEGORY;

    const categoryMap: { [key: string]: string } = {
      'Family': 'family',
      'Friends': 'friends',
      'Work': 'colleagues',
      'Colleagues': 'colleagues',
      'Other': 'other',
      'Partner/Ex': 'romantic',
      'Romantic': 'romantic',
      'Acquaintances': 'acquaintances'
    };

    if (category === category.toLowerCase()) {
      return category;
    }

    return categoryMap[category] || category.toLowerCase();
  }

  private async syncToGoogleCalendar(birthday: Birthday): Promise<string | null> {
    if (this.googleCalendarService.isEnabled()) {
      try {
        return await this.googleCalendarService.syncBirthdayToCalendar(birthday);
      } catch (error) {
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
      }
    }
  }

  private async deleteFromGoogleCalendar(eventId: string): Promise<void> {
    if (this.googleCalendarService.isEnabled()) {
      try {
        await this.googleCalendarService.deleteBirthdayFromCalendar(eventId);
      } catch (error) {
      }
    }
  }
}
