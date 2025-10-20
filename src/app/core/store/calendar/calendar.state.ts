export interface CalendarState {
  selectedDate: Date | null;
  viewMode: 'month' | 'year';
  highlightedDates: Date[];
  loading: boolean;
  error: string | null;
}

export const initialCalendarState: CalendarState = {
  selectedDate: null,
  viewMode: 'month',
  highlightedDates: [],
  loading: false,
  error: null
};
