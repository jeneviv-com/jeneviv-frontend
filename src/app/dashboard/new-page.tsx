"use client";

import { DesktopSidebar } from "@/components/DesktopSidebar";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCollections, useMerchant, usePayouts } from "@/hooks/useApi";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Eye,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: collections } = useCollections();
  const { data: payouts } = usePayouts();
  const { data: merchant } = useMerchant();

  const stats = useMemo(() => {
    if (!collections) return null;

    const totalCollections = collections.length;
    const activeCollections = collections.filter(
      (c) => c.status === "active",
    ).length;
    const totalCollected = collections.reduce(
      (sum, c) => sum + (c.amount || 0),
      0,
    );
    const totalTarget = collections.reduce(
      (sum, c) => sum + (c.amount || 0),
      0,
    );

    return {
      totalCollections,
      activeCollections,
      totalCollected,
      totalTarget,
      conversionRate:
        totalTarget > 0 ? ((totalCollected / totalTarget) * 100).toFixed(1) : 0,
    };
  }, [collections]);

  return (
    <div className="flex h-screen bg-slate-50">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Welcome back
                    {user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
                  </h1>
                  <p className="text-slate-600 mt-2">
                    {new Date().toLocaleDateString("en-NG", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Link
                  href="/collections/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  New Collection
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Collections */}
                <div className="bg-white rounded-lg p-6 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-slate-600">
                      Total Collections
                    </p>
                    <div className="p-2.5 rounded-lg bg-blue-50">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats.totalCollections}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {stats.activeCollections} active
                    </p>
                  </div>
                </div>

                {/* Amount Collected */}
                <div className="bg-white rounded-lg p-6 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-slate-600">
                      Amount Collected
                    </p>
                    <div className="p-2.5 rounded-lg bg-green-50">
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {naira.format(stats.totalCollected)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {stats.conversionRate}% of target
                    </p>
                  </div>
                </div>

                {/* Pending Payouts */}
                <div className="bg-white rounded-lg p-6 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-slate-600">
                      Pending Payouts
                    </p>
                    <div className="p-2.5 rounded-lg bg-amber-50">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {payouts?.filter((p) => p.status === "pending").length ||
                        0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Awaiting processing
                    </p>
                  </div>
                </div>

                {/* Merchant Status */}
                <div className="bg-white rounded-lg p-6 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-slate-600">
                      Account Status
                    </p>
                    <div className="p-2.5 rounded-lg bg-purple-50">
                      <Wallet className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {merchant?.status?.charAt(0).toUpperCase() +
                        merchant?.status?.slice(1) || "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {merchant?.displayName || "Setup profile"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Collections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recent Collections
                  </h2>
                  <Link
                    href="/collections"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View all →
                  </Link>
                </div>

                {collections && collections.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {collections.slice(0, 5).map((collection) => (
                      <div
                        key={collection.id}
                        className="px-6 py-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-slate-900">
                            {collection.name}
                          </h3>
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              collection.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {collection.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-600">
                            {collection.description}
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {naira.format(collection.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-slate-600">No collections yet</p>
                    <Link
                      href="/collections/new"
                      className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                    >
                      Create your first collection →
                    </Link>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-slate-100 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/collections/new"
                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors text-slate-900 font-medium border border-slate-100 hover:border-blue-200"
                  >
                    <Plus className="w-5 h-5 text-blue-600" />
                    New Collection
                  </Link>
                  <Link
                    href="/collections"
                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors text-slate-900 font-medium border border-slate-100 hover:border-blue-200"
                  >
                    <Eye className="w-5 h-5 text-blue-600" />
                    View Collections
                  </Link>
                  <Link
                    href="/transactions"
                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors text-slate-900 font-medium border border-slate-100 hover:border-blue-200"
                  >
                    <ArrowUpRight className="w-5 h-5 text-blue-600" />
                    View Transactions
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors text-slate-900 font-medium border border-slate-100 hover:border-blue-200"
                  >
                    <Download className="w-5 h-5 text-blue-600" />
                    Export Report
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
