import { useAsync } from "@/hooks/useApi";
import { transactionsAPI } from "@/lib/api";
import { useState } from "react";
import { Eye } from "lucide-react";

export default function Transactions() {
  const { data: transactions, loading } = useAsync(() =>
    transactionsAPI.list().then((r) => r.transactions)
  );
  const [selectedTx, setSelectedTx] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Transactions</h1>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Reference</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-900">{tx.reference}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {(tx.total_charged / 100).toLocaleString()} {tx.currency}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setSelectedTx(tx.id)}
                        className="text-orange-600 hover:text-orange-700 flex items-center gap-1"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-600">
                    No transactions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && transactions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            {(() => {
              const tx = transactions.find((t) => t.id === selectedTx);
              return tx ? (
                <>
                  <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-slate-600">Reference:</span>
                      <p className="font-mono font-semibold">{tx.reference}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Amount:</span>
                      <p className="font-semibold">{(tx.amount / 100).toLocaleString()} {tx.currency}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Platform Fee:</span>
                      <p className="font-semibold">{(tx.platform_fee / 100).toLocaleString()} {tx.currency}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Gateway Fee:</span>
                      <p className="font-semibold">{(tx.gateway_fee / 100).toLocaleString()} {tx.currency}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Total Charged:</span>
                      <p className="font-semibold">{(tx.total_charged / 100).toLocaleString()} {tx.currency}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Status:</span>
                      <p className={`font-semibold ${tx.status === "success" ? "text-green-600" : "text-yellow-600"}`}>
                        {tx.status}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">Date:</span>
                      <p className="font-semibold">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="w-full mt-6 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300"
                  >
                    Close
                  </button>
                </>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
