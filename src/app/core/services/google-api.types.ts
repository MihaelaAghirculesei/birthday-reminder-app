export interface GapiAuthResponse {
  expires_at: number;
}

export interface GapiUser {
  getAuthResponse(includeAuthorizationData?: boolean): GapiAuthResponse;
  reloadAuthResponse(): Promise<void>;
}

export interface GapiIsSignedIn {
  get(): boolean;
  listen(listener: (isSignedIn: boolean) => void): void;
}

export interface GapiCurrentUser {
  get(): GapiUser;
}

export interface GapiAuthInstance {
  currentUser: GapiCurrentUser;
  isSignedIn: GapiIsSignedIn;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}

export interface GapiAuth2 {
  getAuthInstance(): GapiAuthInstance;
}

export interface GapiCalendarListResponse {
  result: {
    items: { id: string; summary: string }[];
  };
}

export interface GapiEventResponse {
  result: {
    id?: string;
    [key: string]: unknown;
  };
}

export interface GapiCalendarList {
  list(): Promise<GapiCalendarListResponse>;
}

export interface GapiEvents {
  insert(params: unknown): Promise<GapiEventResponse>;
  update(params: unknown): Promise<GapiEventResponse>;
  delete(params: unknown): Promise<GapiEventResponse>;
}

export interface GapiCalendar {
  calendarList: GapiCalendarList;
  events: GapiEvents;
}

export interface GapiClient {
  calendar: GapiCalendar;
  init(config: {
    apiKey: string;
    clientId: string;
    discoveryDocs: string[];
    scope: string;
  }): Promise<void>;
}

export interface Gapi {
  auth2: GapiAuth2;
  client: GapiClient;
  load(libraries: string, callback: () => void): void;
}

declare global {
  interface Window {
    gapi?: Gapi;
  }
}
