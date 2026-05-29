import type { DashboardData } from "@/types/dashboard";
import { NextResponse } from "next/server";

const MOCK: DashboardData = {
  user: {
    firstName: "Annbel",
    lastName: "Okon",
    university: "University of Uyo",
    department: "Computer Science",
    bankStatus: "approved",
  },
  balances: {
    payoutBalance: 480_000,
    walletBalance: 494_900,
  },
  stats: {
    activeCollections: 3,
    totalPayers: 412,
    TotalAmount: 1_240_000,
  },
  recentCollections: [
    {
      id: "col_1",
      name: "CSC311 Handout",
      department: "Computer Science",
      level: "300L",
      amountTarget: 500_000,
      amountCollected: 340_000,
      payerCount: 136,
      pendingCount: 64,
      status: "active",
      createdAt: "2026-05-12T09:00:00Z",
    },
    {
      id: "col_2",
      name: "Departmental Levy 2025/26",
      department: "Computer Science",
      level: "300L",
      amountTarget: 800_000,
      amountCollected: 612_000,
      payerCount: 204,
      pendingCount: 56,
      status: "active",
      createdAt: "2026-04-28T09:00:00Z",
    },
    {
      id: "col_3",
      name: "Project Materials",
      department: "Computer Science",
      level: "400L",
      amountTarget: 250_000,
      amountCollected: 250_000,
      payerCount: 100,
      pendingCount: 0,
      status: "closed",
      createdAt: "2026-03-15T09:00:00Z",
    },
  ],
};

export async function GET() {
  return NextResponse.json(MOCK);
}
