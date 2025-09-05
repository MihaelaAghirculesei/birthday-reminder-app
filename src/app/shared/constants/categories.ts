export interface BirthdayCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const BIRTHDAY_CATEGORIES: BirthdayCategory[] = [
  {
    id: 'family',
    name: 'Family',
    icon: 'family_restroom',
    color: '#4CAF50'
  },
  {
    id: 'friends',
    name: 'Friends',
    icon: 'groups',
    color: '#2196F3'
  },
  {
    id: 'colleagues',
    name: 'Colleagues',
    icon: 'business_center',
    color: '#FF9800'
  },
  {
    id: 'romantic',
    name: 'Partner/Ex',
    icon: 'favorite',
    color: '#E91E63'
  },
  {
    id: 'acquaintances',
    name: 'Acquaintances',
    icon: 'handshake',
    color: '#9C27B0'
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'stars',
    color: '#607D8B'
  }
];

export const DEFAULT_CATEGORY = 'friends';

export function getCategoryById(id: string): BirthdayCategory | undefined {
  return BIRTHDAY_CATEGORIES.find(cat => cat.id === id);
}

export function getCategoryIcon(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.icon || 'person';
}

export function getCategoryColor(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.color || '#607D8B';
}