export type BankStatus = "pending" | "approved" | "rejected";

export interface DashboardUser {
  firstName: string;
  lastName: string;
  university: string;
  department: string;
  bankStatus: BankStatus;
  bankRejectionReason?: string;
}

export interface DashboardBalances {
  payoutBalance: number;
  walletBalance: number;
}

export interface DashboardStats {
  activeCollections: number;
  totalPayers: number;
  totalAmount: number;
}

export interface Collection {
  id: string;
  name: string;
  department: string;
  level: string;
  amountTarget: number;
  amountCollected: number;
  payerCount: number;
  pendingCount: number;
  is_active: boolean;
  created_at: string;
}

export interface DashboardData {
  user: DashboardUser;
  balances: DashboardBalances;
  stats: DashboardStats;
  recentCollections: Collection[];
}
