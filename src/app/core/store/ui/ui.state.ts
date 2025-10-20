export interface UIState {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  loading: boolean;
  notification: Notification | null;
}

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const initialUIState: UIState = {
  sidebarCollapsed: false,
  darkMode: false,
  loading: false,
  notification: null
};
