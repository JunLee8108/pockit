import {
  Landmark,
  Wallet,
  CreditCard,
  Banknote,
  PiggyBank,
  TrendingUp,
  CircleDollarSign,
  HandCoins,
  Building2,
  Vault,
  BadgeDollarSign,
  Coins,
  Receipt,
  Target,
  Package,
} from "lucide-react";

export const NAV_ITEMS = [
  { id: "dashboard", label: "대시보드", path: "/", icon: "LayoutDashboard" },
  { id: "accounts", label: "계좌", path: "/accounts", icon: "Landmark" },
  {
    id: "transactions",
    label: "거래내역",
    path: "/transactions",
    icon: "Receipt",
  },
  { id: "statistics", label: "통계", path: "/statistics", icon: "BarChart3" },
  { id: "budget", label: "예산", path: "/budget", icon: "Wallet" },
  { id: "categories", label: "카테고리", path: "/categories", icon: "Tag" },
];

export const ACCOUNT_TYPE_LABELS = {
  checking: "입출금",
  savings: "저축",
  credit_card: "신용카드",
  cash: "현금",
  investment: "투자",
};

export const ACCOUNT_TYPE_ORDER = [
  "checking",
  "savings",
  "investment",
  "credit_card",
  "cash",
];

export const ACCOUNT_ICONS = [
  "Landmark",
  "Wallet",
  "CreditCard",
  "Banknote",
  "PiggyBank",
  "TrendingUp",
  "CircleDollarSign",
  "HandCoins",
  "Building2",
  "Vault",
  "BadgeDollarSign",
  "Coins",
  "Receipt",
  "Target",
  "Package",
];

export const ACCOUNT_ICON_MAP = {
  Landmark,
  Wallet,
  CreditCard,
  Banknote,
  PiggyBank,
  TrendingUp,
  CircleDollarSign,
  HandCoins,
  Building2,
  Vault,
  BadgeDollarSign,
  Coins,
  Receipt,
  Target,
  Package,
};

export const ACCOUNT_COLORS = [
  "#0046FF",
  "#3182F6",
  "#FFCD00",
  "#6DD4B4",
  "#F4845F",
  "#A78BFA",
  "#7DD3FC",
  "#FDA4AF",
  "#FCD34D",
  "#6B7280",
  "#C4A44A",
  "#EF4444",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
];
