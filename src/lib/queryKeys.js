export const queryKeys = {
  currencies: ["currencies"],
  accounts: {
    all: ["accounts"],
    detail: (id) => ["accounts", id],
  },
  transactions: {
    all: ["transactions"],
    list: (filters) => ["transactions", "list", filters],
  },
  categories: {
    all: ["categories"],
  },
  budgets: {
    all: ["budgets"],
    list: (params) => ["budgets", params],
  },
  fixedExpenses: {
    all: ["fixed-expenses"],
    list: (params) => ["fixed-expenses", params],
  },
  annualSummary: (year) => ["annual-summary", year],
  annualCategory: (year) => ["annual-category", year],
  tasks: {
    all: ["tasks"],
    list: (filters) => ["tasks", "list", filters],
  },
  taskCategories: {
    all: ["task-categories"],
  },
};
