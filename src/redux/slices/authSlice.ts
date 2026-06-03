export interface AuthState {
  user: null | { id: string; role: 'driver' | 'washer'; name: string };
  isAuthenticated: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
};

export function authReducer(state = initialAuthState) {
  return state;
}
