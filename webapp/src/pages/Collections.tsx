import { useCollections, useCreateCollection } from "@/hooks/useApi";
import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";

export default function Collections() {
  const { data: collections, loading, refetch } = useCollections();
  const { create, loading: creating, error: createError } = useCreateCollection();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    currency: "NGN",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await create({
        name: formData.name,
        description: formData.description,
        amount: parseInt(formData.amount),
        currency: formData.currency,
      });
      setFormData({ name: "", description: "", amount: "", currency: "NGN" });
      setShowForm(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading collections...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Collections</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          <Plus size={20} />
          New Collection
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Collection</h2>
          {(error || createError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error || createError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Collection Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Collection"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {collections && collections.length > 0 ? (
          collections.map((collection) => (
            <div
              key={collection.id}
              className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{collection.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{collection.description}</p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-slate-600">
                      Code: <span className="font-mono font-semibold">{collection.short_code}</span>
                    </span>
                    <span className="text-slate-600">
                      Amount: <span className="font-semibold">{collection.amount.toLocaleString()} {collection.currency}</span>
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      collection.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      {collection.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                    <Edit2 size={18} />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-600">
            <p>No collections yet. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
