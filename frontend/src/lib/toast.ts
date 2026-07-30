type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let listeners: Listener[] = [];

const emit = () => listeners.forEach((fn) => fn([...toasts]));

export const toast = {
  success: (message: string) => {
    const id = crypto.randomUUID();
    toasts = [...toasts, { id, type: "success", message }];
    emit();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    }, 4000);
  },
  error: (message: string) => {
    const id = crypto.randomUUID();
    toasts = [...toasts, { id, type: "error", message }];
    emit();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    }, 5000);
  },
  info: (message: string) => {
    const id = crypto.randomUUID();
    toasts = [...toasts, { id, type: "info", message }];
    emit();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    }, 3000);
  },
  subscribe: (fn: Listener) => {
    listeners = [...listeners, fn];
    return () => { listeners = listeners.filter((l) => l !== fn); };
  },
  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  },
};
