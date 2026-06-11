"use client";

import { DashboardNav } from "@/components/DashboardNav";
import { useAuth } from "@/context/AuthContext";
import type { DashboardData } from "@/types/dashboard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/rep/dashboard");
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardNav />

      <main className="flex-1 lg:ml-64">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-2">Welcome back, {user.name}</p>
            </div>

            {dashboardData ? (
              <>
                {/* Balances */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-slate-600 text-sm font-medium">
                      Payout Balance
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      ₦{dashboardData.balances.payoutBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-slate-600 text-sm font-medium">
                      Wallet Balance
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      ₦{dashboardData.balances.walletBalance.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-slate-600 text-sm font-medium">
                      Active Collections
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      {dashboardData.stats.activeCollections}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-slate-600 text-sm font-medium">
                      Total Payers
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      {dashboardData.stats.totalPayers}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-slate-600 text-sm font-medium">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      ₦{dashboardData.stats.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Recent Collections */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">
                      Recent Collections
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                            Target
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                            Collected
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {dashboardData.recentCollections.map((collection) => (
                          <tr key={collection.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {collection.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {collection.department}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              ₦{collection.amountTarget.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              ₦{collection.amountCollected.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  collection.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {collection.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-slate-600">No dashboard data available</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
