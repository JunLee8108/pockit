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
  budgets: { all: ["budgets"] },
};
