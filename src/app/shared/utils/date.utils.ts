export function getDaysUntilBirthday(birthDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextBirthday = getNextBirthdayDate(birthDate);
  nextBirthday.setHours(0, 0, 0, 0);
  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getNextBirthdayDate(birthDate: Date): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const nextBirthday = new Date(birthDate);
  nextBirthday.setFullYear(currentYear);
  nextBirthday.setHours(0, 0, 0, 0);

  if (nextBirthday < today) {
    nextBirthday.setFullYear(currentYear + 1);
  }

  return nextBirthday;
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow!';
  return `In ${days} days`;
}
