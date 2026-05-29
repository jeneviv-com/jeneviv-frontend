import { useAuth } from "@/context/AuthContext";
import { useCollections, useMerchant, usePayouts } from "@/hooks/useApi";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: collections, loading: collectionsLoading } = useCollections();
  const { data: merchant, loading: merchantLoading } = useMerchant();
  const { data: payouts, loading: payoutsLoading } = usePayouts();

  const loading = collectionsLoading || merchantLoading || payoutsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  const totalCollections = collections?.length || 0;
  const totalPendingPayouts =
    payouts?.filter((p) => p.status === "pending").length || 0;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-900">
        Welcome, {user?.name || "User"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="text-sm text-slate-600">Total Collections</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            {totalCollections}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="text-sm text-slate-600">Account Status</div>
          <div className="text-lg font-semibold text-slate-900 mt-2">
            {merchant?.status || "Pending"}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="text-sm text-slate-600">Pending Payouts</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            {totalPendingPayouts}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="text-sm text-slate-600">Status</div>
          <div className="text-lg font-semibold text-green-600 mt-2">
            Active
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Recent Collections
        </h2>
        {collections && collections.length > 0 ? (
          <div className="space-y-2">
            {collections.slice(0, 5).map((collection) => (
              <div
                key={collection.id}
                className="bg-white p-4 rounded-lg border border-slate-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {collection.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {collection.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {collection.currency}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-600">No collections yet</div>
        )}
      </div>
    </div>
  );
}
