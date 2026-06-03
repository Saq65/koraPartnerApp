export interface OrderState {
  items: unknown[];
  selectedOrderId: string | null;
}

export const initialOrderState: OrderState = {
  items: [],
  selectedOrderId: null,
};

export function orderReducer(state = initialOrderState) {
  return state;
}
