const CACHE_NAME = 'birthday-app-v1';
const CHECK_INTERVAL = 60000;

self.addEventListener('install', (event) => {
  console.log('[Custom SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Custom SW] Activating...');
  event.waitUntil(self.clients.claim());
  startNotificationChecker();
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow(data.url || '/')
    );
  }
});

function startNotificationChecker() {
  console.log('[Custom SW] Starting notification checker...');

  setInterval(() => {
    checkScheduledNotifications();
  }, CHECK_INTERVAL);

  checkScheduledNotifications();
}

async function checkScheduledNotifications() {
  console.log('[Custom SW] Checking scheduled messages...');

  try {
    const db = await openIndexedDB();
    const messages = await getAllScheduledMessages(db);
    const birthdays = await getAllBirthdays(db);
    const now = new Date();

    console.log(`[Custom SW] Found ${messages.length} scheduled messages`);
    console.log(`[Custom SW] Current time: ${now.toLocaleTimeString()}`);

    for (const message of messages) {
      if (!message.active) {
        console.log(`[Custom SW] Message ${message.id} is inactive, skipping`);
        continue;
      }

      const birthday = birthdays.find(b => b.id === message.birthdayId);
      if (!birthday) {
        console.log(`[Custom SW] Birthday not found for message ${message.id}`);
        continue;
      }

      if (shouldSendNotification(birthday, message, now)) {
        console.log(`[Custom SW] Sending notification for ${birthday.name}`);
        await sendNotification(db, birthday, message);
      }
    }
  } catch (error) {
    console.error('[Custom SW] Error checking notifications:', error);
  }
}

function shouldSendNotification(birthday, message, now) {
  const birthDate = new Date(birthday.birthDate);
  const thisYearBirthday = new Date(
    now.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  const [hours, minutes] = message.scheduledTime.split(':').map(Number);
  const scheduledTime = new Date(thisYearBirthday);
  scheduledTime.setHours(hours, minutes, 0, 0);

  const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
  const isWithinOneMinute = timeDiff < 60000;

  console.log(`[Custom SW] Message ${message.id}:`, {
    scheduledTime: scheduledTime.toLocaleString(),
    currentTime: now.toLocaleString(),
    timeDiff: `${Math.round(timeDiff / 1000)}s`,
    isWithinOneMinute
  });

  const lastSent = message.lastSentDate ? new Date(message.lastSentDate) : null;
  const notSentToday = !lastSent ||
    lastSent.getFullYear() !== now.getFullYear() ||
    lastSent.getMonth() !== now.getMonth() ||
    lastSent.getDate() !== now.getDate();

  console.log(`[Custom SW] Last sent:`, lastSent ? lastSent.toLocaleString() : 'Never', 'Not sent today:', notSentToday);

  return isWithinOneMinute && notSentToday;
}

async function sendNotification(db, birthday, message) {
  try {
    const formattedMessage = formatMessage(message.message, birthday);

    await self.registration.showNotification(
      message.title || '🎂 Birthday Reminder',
      {
        body: formattedMessage,
        icon: '/assets/icons/logo-reminder.png',
        tag: `birthday-${birthday.id}-${message.id}`,
        requireInteraction: true,
        data: {
          birthdayId: birthday.id,
          messageId: message.id,
          name: birthday.name,
          url: '/'
        }
      }
    );

    console.log(`[Custom SW] Notification sent for ${birthday.name}`);

    await markMessageAsSent(db, message.id);
  } catch (error) {
    console.error('[Custom SW] Error sending notification:', error);
  }
}

function formatMessage(template, birthday) {
  const age = calculateAge(birthday.birthDate);

  return template
    .replace(/\{name\}/g, birthday.name)
    .replace(/\{age\}/g, age?.toString() || '')
    .replace(/\{zodiac\}/g, birthday.zodiacSign || '');
}

function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

async function markMessageAsSent(db, messageId) {
  try {
    const message = await getScheduledMessageById(db, messageId);
    if (!message) {
      console.error('[Custom SW] Message not found:', messageId);
      return;
    }

    const updatedMessage = {
      ...message,
      lastSentDate: new Date().toISOString(),
      sentCount: (message.sentCount || 0) + 1,
      notificationSent: true,
      lastNotificationId: `notif-${Date.now()}`
    };

    await updateScheduledMessage(db, updatedMessage);
    console.log('[Custom SW] Message marked as sent:', messageId);
  } catch (error) {
    console.error('[Custom SW] Error marking message as sent:', error);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BirthdayReminderDB', 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('birthdays')) {
        const birthdayStore = db.createObjectStore('birthdays', { keyPath: 'id' });
        birthdayStore.createIndex('name', 'name', { unique: false });
        birthdayStore.createIndex('birthDate', 'birthDate', { unique: false });
      }

      if (!db.objectStoreNames.contains('scheduledMessages')) {
        const messageStore = db.createObjectStore('scheduledMessages', { keyPath: 'id' });
        messageStore.createIndex('birthdayId', 'birthdayId', { unique: false });
        messageStore.createIndex('active', 'active', { unique: false });
      }
    };
  });
}

function getAllBirthdays(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['birthdays'], 'readonly');
    const store = transaction.objectStore('birthdays');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const birthdays = request.result.map(b => ({
        ...b,
        birthDate: new Date(b.birthDate)
      }));
      resolve(birthdays);
    };
  });
}

function getAllScheduledMessages(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['scheduledMessages'], 'readonly');
    const store = transaction.objectStore('scheduledMessages');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function getScheduledMessageById(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['scheduledMessages'], 'readonly');
    const store = transaction.objectStore('scheduledMessages');
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function updateScheduledMessage(db, message) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['scheduledMessages'], 'readwrite');
    const store = transaction.objectStore('scheduledMessages');
    const request = store.put(message);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
