import { create } from "zustand";

const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Mobile Drawer
  mobileDrawerOpen: false,
  openMobileDrawer: () => set({ mobileDrawerOpen: true }),
  closeMobileDrawer: () => set({ mobileDrawerOpen: false }),

  // Account Form
  accountFormOpen: false,
  accountEditTarget: null,
  openAccountForm: (target = null) =>
    set({ accountFormOpen: true, accountEditTarget: target }),
  closeAccountForm: () =>
    set({ accountFormOpen: false, accountEditTarget: null }),

  // Transaction Form
  txFormOpen: false,
  txEditTarget: null,
  openTxForm: (target = null) =>
    set({ txFormOpen: true, txEditTarget: target }),
  closeTxForm: () => set({ txFormOpen: false, txEditTarget: null }),

  // Fixed Expense Form
  feFormOpen: false,
  feEditTarget: null,
  openFeForm: (target = null) =>
    set({ feFormOpen: true, feEditTarget: target }),
  closeFeForm: () => set({ feFormOpen: false, feEditTarget: null }),
}));

export default useUIStore;
