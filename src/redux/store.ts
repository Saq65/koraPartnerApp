export interface AppStore {
  auth: {
    user: null | { id: string; role: 'driver' | 'washer'; name: string };
    isAuthenticated: boolean;
  };
  orders: {
    items: unknown[];
    selectedOrderId: string | null;
  };
}

export const store: AppStore = {
  auth: {
    user: null,
    isAuthenticated: false,
  },
  orders: {
    items: [],
    selectedOrderId: null,
  },
};
