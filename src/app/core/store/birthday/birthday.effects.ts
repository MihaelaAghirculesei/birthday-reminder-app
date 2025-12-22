import { Injectable, isDevMode } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';
import * as BirthdayActions from './birthday.actions';
import { IndexedDBStorageService } from '../../services/offline-storage.service';
import { NotificationService } from '../../services/notification.service';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { IdGeneratorService } from '../../services/id-generator.service';
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
          id: this.idGenerator.generateId(),
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
          this.pushNotificationService.cancelAllNotificationsForBirthday(id);
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
      mergeMap(({ birthdayId, message }) =>
        this.offlineStorage.saveScheduledMessage(message).then(() =>
          this.offlineStorage.getBirthdays()
        ).then(birthdays => {
          const birthday = birthdays.find(b => b.id === birthdayId);
          if (birthday) {
            const updatedBirthday = {
              ...birthday,
              scheduledMessages: [...(birthday.scheduledMessages || []), message]
            };
            this.pushNotificationService.scheduleNotification(birthday, message);
            return this.offlineStorage.updateBirthday(updatedBirthday);
          }
          return Promise.resolve();
        }).then(() =>
          BirthdayActions.addMessageToBirthdaySuccess({ birthdayId, message })
        ).catch(error =>
          BirthdayActions.addMessageToBirthdayFailure({ error: error.message || 'Failed to add message' })
        )
      )
    )
  );

  updateMessageInBirthday$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BirthdayActions.updateMessageInBirthday),
      mergeMap(({ birthdayId, messageId, updates }) =>
        this.offlineStorage.getScheduledMessagesByBirthday(birthdayId).then(messages => {
          const message = messages.find(m => m.id === messageId);
          if (message) {
            const updatedMessage = { ...message, ...updates };
            return this.offlineStorage.updateScheduledMessage(updatedMessage);
          }
          return Promise.resolve();
        }).then(() =>
          this.offlineStorage.getBirthdays()
        ).then(birthdays => {
          const birthday = birthdays.find(b => b.id === birthdayId);
          if (birthday?.scheduledMessages) {
            const updatedMessages = birthday.scheduledMessages.map(msg =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            );
            const updatedBirthday = {
              ...birthday,
              scheduledMessages: updatedMessages
            };
            return this.offlineStorage.updateBirthday(updatedBirthday);
          }
          return Promise.resolve();
        }).then(() =>
          BirthdayActions.updateMessageInBirthdaySuccess({ birthdayId, messageId, updates })
        ).catch(error =>
          BirthdayActions.updateMessageInBirthdayFailure({ error: error.message || 'Failed to update message' })
        )
      )
    )
  );

  deleteMessageFromBirthday$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BirthdayActions.deleteMessageFromBirthday),
      mergeMap(({ birthdayId, messageId }) =>
        this.offlineStorage.deleteScheduledMessage(messageId).then(() => {
          this.pushNotificationService.cancelNotification(birthdayId, messageId);
          return this.offlineStorage.getBirthdays();
        }).then(birthdays => {
          const birthday = birthdays.find(b => b.id === birthdayId);
          if (birthday?.scheduledMessages) {
            const updatedMessages = birthday.scheduledMessages.filter(msg => msg.id !== messageId);
            const updatedBirthday = {
              ...birthday,
              scheduledMessages: updatedMessages
            };
            return this.offlineStorage.updateBirthday(updatedBirthday);
          }
          return Promise.resolve();
        }).then(() =>
          BirthdayActions.deleteMessageFromBirthdaySuccess({ birthdayId, messageId })
        ).catch(error =>
          BirthdayActions.deleteMessageFromBirthdayFailure({ error: error.message || 'Failed to delete message' })
        )
      )
    )
  );

  addMessageToBirthdayFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BirthdayActions.addMessageToBirthdayFailure),
        tap(({ error }) => {
          this.notificationService.show(`Failed to add message: ${error}`, 'error');
        })
      ),
    { dispatch: false }
  );

  updateMessageInBirthdayFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BirthdayActions.updateMessageInBirthdayFailure),
        tap(({ error }) => {
          this.notificationService.show(`Failed to update message: ${error}`, 'error');
        })
      ),
    { dispatch: false }
  );

  deleteMessageFromBirthdayFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BirthdayActions.deleteMessageFromBirthdayFailure),
        tap(({ error }) => {
          this.notificationService.show(`Failed to delete message: ${error}`, 'error');
        })
      ),
    { dispatch: false }
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
    private googleCalendarService: GoogleCalendarService,
    private pushNotificationService: PushNotificationService,
    private idGenerator: IdGeneratorService
  ) {}

  private generateTestData(): Birthday[] {
    const testNames = [
      { name: 'Uwe Müller', date: new Date(1990, 2, 15), category: 'family', photo: 'https://i.pravatar.cc/200?img=1', notes: 'Loves reading fantasy books, coffee enthusiast, collects vinyl records' },
      { name: 'Bob Smith', date: new Date(1985, 5, 22), category: 'friends', photo: 'https://i.pravatar.cc/200?img=12', notes: 'Passionate about photography, likes Canon gear, favorite color blue' },
      { name: 'Charlie Brown', date: new Date(1992, 8, 10), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=13', notes: 'Gym fanatic, loves protein supplements, enjoys Marvel movies' },
      { name: 'Diana Prince', date: new Date(1988, 11, 5), category: 'friends', photo: 'https://i.pravatar.cc/200?img=5', notes: 'Plays guitar, into rock music, follows Formula 1' },
      { name: 'Edward Norton', date: new Date(1995, 1, 28), category: 'family', photo: 'https://i.pravatar.cc/200?img=14', notes: 'Gardening lover, prefers succulents, allergic to cats' },
      { name: 'Fiona Apple', date: new Date(1987, 6, 18), category: 'romantic', photo: 'https://i.pravatar.cc/200?img=9', notes: 'Yoga instructor, loves organic tea, into meditation apps, gluten-free diet' },
      { name: 'George Martin', date: new Date(1993, 9, 3), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=15', notes: 'Gaming PC builder, plays FPS games, favorite: Call of Duty' },
      { name: 'Hannah Montana', date: new Date(1991, 3, 12), category: 'friends', photo: 'https://i.pravatar.cc/200?img=10', notes: 'Vegetarian, loves Italian food, enjoys white wine' },
      { name: 'Isabella Garcia', date: new Date(1994, 0, 8), category: 'family', photo: 'https://i.pravatar.cc/200?img=16', notes: 'Fashion enthusiast, wears size S, prefers minimalist style' },
      { name: 'Jack Thompson', date: new Date(1989, 4, 19), category: 'acquaintances', photo: 'https://i.pravatar.cc/200?img=17', notes: 'Tech geek, uses iPhone 15, wants AirPods Pro' },
      { name: 'Katherine Lee', date: new Date(1996, 7, 25), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=20', notes: 'Works in finance, lives in London, has 1 dog' },
      { name: 'Liam O\'Connor', date: new Date(1986, 10, 14), category: 'friends', photo: 'https://i.pravatar.cc/200?img=33', notes: 'Studying law, energy drink addict, night owl' },
      { name: 'Maya Patel', date: new Date(1993, 1, 28), category: 'family', photo: 'https://i.pravatar.cc/200?img=21', notes: 'Recently moved to NYC, learning Spanish, loves hiking' },
      { name: 'Olivia Martinez', date: new Date(1997, 9, 21), category: 'friends', photo: 'https://i.pravatar.cc/200?img=47', notes: 'Software developer, mechanical keyboard fan, plays chess online' },
      { name: 'Patrick Anderson', date: new Date(1984, 1, 16), category: 'acquaintances', photo: null, notes: 'Marathon runner, vegan diet, prefers Nike running shoes' },
      { name: 'Quinn Roberts', date: new Date(1992, 6, 11), category: 'family', photo: 'https://i.pravatar.cc/200?img=23', notes: 'Baker, loves desserts, watches cooking shows' },
      { name: 'Rachel Green', date: new Date(1990, 8, 4), category: 'friends', photo: 'https://i.pravatar.cc/200?img=24', notes: 'Travel blogger, visited 40 countries, wants to go to Japan' },
      { name: 'Hanna Gau', date: new Date(1988, 3, 29), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=25', notes: 'Art collector, into abstract painting, favorite artist: Kandinsky' },
      { name: 'Tiffany Chen', date: new Date(1995, 11, 23), category: 'friends', photo: 'https://i.pravatar.cc/200?img=26', notes: 'K-pop fan, loves BTS, collects albums and merch' },
      { name: 'Ulysses Grant', date: new Date(1987, 0, 17), category: 'other', photo: null, notes: 'History teacher, Civil War enthusiast, reads biographies' },
      { name: 'Vanessa Lopez', date: new Date(1994, 4, 9), category: 'family', photo: 'https://i.pravatar.cc/200?img=27', notes: 'Nurse, works night shifts, coffee lover, has 2 kids' },
      { name: 'Julia Davis', date: new Date(1989, 7, 13), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=28', notes: 'Wine connoisseur, prefers red wine, visits vineyards' },
      { name: 'Anna Wilson', date: new Date(1996, 10, 27), category: 'friends', photo: 'https://i.pravatar.cc/200?img=29', notes: 'Dog trainer, has 3 Golden Retrievers, loves outdoor activities' },
      { name: 'Yasmin Ahmed', date: new Date(1985, 2, 6), category: 'family', photo: 'https://i.pravatar.cc/200?img=30', notes: 'Architect, into modern design, favorite color green' },
      { name: 'Sophia Moore', date: new Date(1993, 5, 20), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=31', notes: 'Pianist, plays classical music, enjoys concerts' },
      { name: 'Amelia Clark', date: new Date(1991, 8, 15), category: 'friends', photo: 'https://i.pravatar.cc/200?img=32', notes: 'Bookworm, loves mystery novels, favorite author: Agatha Christie' },
      { name: 'Benjamin Harris', date: new Date(1988, 1, 2), category: 'acquaintances', photo: null, notes: 'Car enthusiast, drives BMW, follows F1 racing' },
      { name: 'Chloe Walker', date: new Date(1997, 4, 24), category: 'family', photo: 'https://i.pravatar.cc/200?img=34', notes: 'Makeup artist, loves beauty products, wears MAC cosmetics' },
      { name: 'Daniela Young', date: new Date(1986, 7, 8), category: 'romantic', photo: 'https://i.pravatar.cc/200?img=35', notes: 'Chef, loves cooking Asian food, allergic to shellfish' },
      { name: 'Emily Turner', date: new Date(1994, 10, 18), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=36', notes: 'Marketing manager, drinks matcha lattes, early bird' },
      { name: 'Chloe Rodriguez', date: new Date(1992, 2, 12), category: 'friends', photo: 'https://i.pravatar.cc/200?img=37', notes: 'Surfer, lives near beach, into sustainable fashion' },
      { name: 'Grace Mitchell', date: new Date(1990, 5, 26), category: 'family', photo: 'https://i.pravatar.cc/200?img=38', notes: 'Interior designer, loves Scandinavian style, prefers neutral colors' },
      { name: 'Henry Phillips', date: new Date(1987, 9, 1), category: 'other', photo: null, notes: 'Watches collector, into vintage Rolex, investment banker' },
      { name: 'Iris Campbell', date: new Date(1995, 1, 14), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=48', notes: 'Dancer, teaches ballet, vegan, shoe size 38' },
      { name: 'Jessica Parker', date: new Date(1989, 6, 30), category: 'friends', photo: 'https://i.pravatar.cc/200?img=40', notes: 'Journalist, writes for The Times, loves investigative stories' },
      { name: 'Kylie Evans', date: new Date(1996, 3, 5), category: 'family', photo: 'https://i.pravatar.cc/200?img=41', notes: 'Pharmacist, lactose intolerant, prefers herbal remedies' },
      { name: 'Lena Collins', date: new Date(1984, 8, 22), category: 'colleagues', photo: 'https://i.pravatar.cc/200?img=42', notes: 'Cyclist, does 100km rides, needs cycling gear' },
      { name: 'Mia Stewart', date: new Date(1993, 11, 10), category: 'friends', photo: 'https://i.pravatar.cc/200?img=43', notes: 'Barista, coffee expert, wants espresso machine' },
      { name: 'Noah Morris', date: new Date(1991, 0, 28), category: 'acquaintances', photo: 'https://i.pravatar.cc/200?img=51', notes: 'Skateboarder, into street wear, wears Vans shoes' },
      { name: 'Penelope Cox', date: new Date(1988, 4, 16), category: 'family', photo: 'https://i.pravatar.cc/200?img=44', notes: 'Veterinarian, has 4 cats, loves animals, works weekends' },
      { name: 'Roberta Bailey', date: new Date(1997, 7, 3), category: 'friends', photo: 'https://i.pravatar.cc/200?img=45', notes: 'Singer, into indie music, plays at local venues' },
      { name: 'Marcus "Ninja" Johnson', date: new Date(1995, 5, 14), category: 'gaming', photo: 'https://i.pravatar.cc/200?img=52', notes: 'Twitch streamer, plays Fortnite, uses Razer peripherals' },
      { name: 'Sarah "GamerGirl" Lee', date: new Date(1998, 8, 22), category: 'gaming', photo: 'https://i.pravatar.cc/200?img=46', notes: 'League of Legends pro, wants gaming chair, drinks Red Bull' },
      { name: 'Alex "ProPlayer" Chen', date: new Date(1992, 11, 8), category: 'gaming', photo: 'https://i.pravatar.cc/200?img=53', notes: 'Esports coach, CS:GO expert, prefers SteelSeries gear' },
      { name: 'Tyler "Speedrunner" Walsh', date: new Date(1996, 3, 18), category: 'gaming', photo: 'https://i.pravatar.cc/200?img=54', notes: 'Speedruns Mario games, collects retro consoles, Nintendo fan' }
    ];

    return testNames.map(({ name, date, category, photo, notes }) => ({
      id: this.idGenerator.generateId(),
      name,
      birthDate: date,
      zodiacSign: getZodiacSign(date).name,
      reminderDays: 7,
      category,
      notes,
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

    const categoryMap: Record<string, string> = {
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
        if (isDevMode()) {
          console.error('[BirthdayEffects] Failed to sync to Google Calendar:', error);
        }
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
        if (isDevMode()) {
          console.error('[BirthdayEffects] Failed to update Google Calendar:', error);
        }
      }
    }
  }

  private async deleteFromGoogleCalendar(eventId: string): Promise<void> {
    if (this.googleCalendarService.isEnabled()) {
      try {
        await this.googleCalendarService.deleteBirthdayFromCalendar(eventId);
      } catch (error) {
        if (isDevMode()) {
          console.error('[BirthdayEffects] Failed to delete from Google Calendar:', error);
        }
      }
    }
  }
}
