import { useMerchant, useBankAccounts, useAddBankAccount } from "@/hooks/useApi";
import { merchantsAPI, banksAPI } from "@/lib/api";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function Settings() {
  const { data: merchant, loading: merchantLoading, refetch: refetchMerchant } = useMerchant();
  const { data: bankAccounts, loading: accountsLoading, refetch: refetchAccounts } = useBankAccounts();
  const { add: addBankAccount, loading: addingAccount, error: addError } = useAddBankAccount();

  const [showBankForm, setShowBankForm] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [bankFormData, setBankFormData] = useState({
    bank_code: "",
    account_number: "",
    currency: "NGN",
    is_default: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    banksAPI.list("NG").then((r) => setBanks(r.banks)).catch(console.error);
  }, []);

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    try {
      await addBankAccount({
        bank_code: bankFormData.bank_code,
        account_number: bankFormData.account_number,
        currency: bankFormData.currency,
        is_default: bankFormData.is_default,
      });
      setBankFormData({ bank_code: "", account_number: "", currency: "NGN", is_default: false });
      setShowBankForm(false);
      setSuccessMsg("Bank account added successfully");
      refetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add bank account");
    }
  };

  const handleUpdateSettings = async (settings: any) => {
    try {
      await merchantsAPI.updateSettings(settings);
      setSuccessMsg("Settings updated successfully");
      refetchMerchant();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    }
  };

  if (merchantLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Settings</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {successMsg}
        </div>
      )}

      {/* Merchant Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Merchant Account</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600">Display Name</label>
            <p className="font-semibold text-slate-900">{merchant?.display_name || "Not set"}</p>
          </div>
          <div>
            <label className="text-sm text-slate-600">Status</label>
            <p className={`font-semibold ${
              merchant?.status === "approved" ? "text-green-600" :
              merchant?.status === "pending" ? "text-yellow-600" :
              "text-red-600"
            }`}>
              {merchant?.status?.toUpperCase()}
            </p>
          </div>
          <div>
            <label className="text-sm text-slate-600">Wallet Balance</label>
            <p className="font-semibold text-slate-900">
              {merchant ? `₦${(merchant.wallet_balance_ngn / 100).toLocaleString()}` : "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm text-slate-600">Payouts Balance</label>
            <p className="font-semibold text-slate-900">
              {merchant ? `₦${(merchant.payouts_balance_ngn / 100).toLocaleString()}` : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Payout Settings */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Payout Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payout Mode</label>
            <select
              value={merchant?.payout_mode || "manual"}
              onChange={(e) => handleUpdateSettings({ payout_mode: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="manual">Manual</option>
              <option value="auto_daily">Automatic Daily</option>
              <option value="auto_weekly">Automatic Weekly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Notification Period
            </label>
            <select
              value={merchant?.email_notification_period || "immediate"}
              onChange={(e) => handleUpdateSettings({ email_notification_period: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly</option>
              <option value="6hourly">Every 6 Hours</option>
              <option value="12hourly">Every 12 Hours</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={merchant?.email_notification_for_transactions || false}
              onChange={(e) => handleUpdateSettings({ email_notification_for_transactions: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Email notifications for transactions</span>
          </label>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Bank Accounts</h2>
          <button
            onClick={() => setShowBankForm(!showBankForm)}
            className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 text-sm"
          >
            <Plus size={16} />
            Add Account
          </button>
        </div>

        {showBankForm && (
          <form onSubmit={handleAddBankAccount} className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                {addError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank</label>
                <select
                  value={bankFormData.bank_code}
                  onChange={(e) => setBankFormData({ ...bankFormData, bank_code: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={bankFormData.account_number}
                  onChange={(e) => setBankFormData({ ...bankFormData, account_number: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bankFormData.is_default}
                  onChange={(e) => setBankFormData({ ...bankFormData, is_default: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Set as default</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addingAccount}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
                >
                  {addingAccount ? "Adding..." : "Add Account"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBankForm(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {bankAccounts && bankAccounts.length > 0 ? (
            bankAccounts.map((account) => (
              <div key={account.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">{account.account_number}</p>
                  <p className="text-sm text-slate-600">{account.bank_code}</p>
                  {account.is_default && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-1 inline-block">
                      Default
                    </span>
                  )}
                </div>
                <button className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-600 py-4">No bank accounts added yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
