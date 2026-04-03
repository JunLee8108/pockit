import { create } from "zustand";

let toastId = 0;

const useToastStore = create((set) => ({
  toasts: [],

  success: (message) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, type: "success", message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },

  error: (message) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, type: "error", message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  remove: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

export default useToastStore;
