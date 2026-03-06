import { create } from "zustand";

const useConfirmStore = create((set) => ({
  open: false,
  title: "",
  message: "",
  confirmText: "확인",
  cancelText: "취소",
  variant: "danger",
  resolve: null,

  openConfirm: (options) =>
    new Promise((resolve) => {
      set({
        open: true,
        title: options.title || "확인",
        message: options.message || "",
        confirmText: options.confirmText || "확인",
        cancelText: options.cancelText || "취소",
        variant: options.variant || "danger",
        resolve,
      });
    }),

  close: (result) =>
    set((state) => {
      state.resolve?.(result);
      return {
        open: false,
        title: "",
        message: "",
        confirmText: "확인",
        cancelText: "취소",
        variant: "danger",
        resolve: null,
      };
    }),
}));

export default useConfirmStore;
