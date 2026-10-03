import { create } from "zustand";

const useConfirmStore = create((set) => ({
  open: false,
  title: "",
  message: "",
  confirmText: "확인",
  cancelText: "취소",
  variant: "danger",
  // 선택지 모드: [{ value, label }] — 확인 시 선택한 value로 resolve
  choices: null,
  choice: null,
  resolve: null,

  setChoice: (choice) => set({ choice }),

  openConfirm: (options) =>
    new Promise((resolve) => {
      set({
        open: true,
        title: options.title || "확인",
        message: options.message || "",
        confirmText: options.confirmText || "확인",
        cancelText: options.cancelText || "취소",
        variant: options.variant || "danger",
        choices: options.choices || null,
        choice: options.choices ? (options.defaultChoice ?? options.choices[0].value) : null,
        resolve,
      });
    }),

  close: (result) =>
    set((state) => {
      state.resolve?.(result && state.choices ? state.choice : result);
      return {
        open: false,
        title: "",
        message: "",
        confirmText: "확인",
        cancelText: "취소",
        variant: "danger",
        choices: null,
        choice: null,
        resolve: null,
      };
    }),
}));

export default useConfirmStore;
