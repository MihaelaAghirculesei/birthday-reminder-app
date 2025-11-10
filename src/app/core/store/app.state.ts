import { BirthdayState } from './birthday/birthday.state';
import { UIState } from './ui/ui.state';
import { CalendarState } from './calendar/calendar.state';
import { CategoryState } from './category/category.state';

export interface AppState {
  birthdays: BirthdayState;
  ui: UIState;
  calendar: CalendarState;
  categories: CategoryState;
}
