import { useMemo } from 'react';

export function useDriverOrders() {
  return useMemo(
    () => ({
      orders: [],
      loading: false,
    }),
    []
  );
}
