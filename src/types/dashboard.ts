export type BankStatus = "pending" | "approved" | "rejected";
export type CollectionStatus = "active" | "closed" | "expired";

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
  TotalAmount: number;
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
  status: CollectionStatus;
  createdAt: string;
}

export interface DashboardData {
  user: DashboardUser;
  balances: DashboardBalances;
  stats: DashboardStats;
  recentCollections: Collection[];
}
