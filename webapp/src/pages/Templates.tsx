import { useTemplates, useCreateTemplate } from "@/hooks/useApi";
import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";

export default function Templates() {
  const { data: templates, loading, refetch } = useTemplates();
  const { create, loading: creating, error: createError } = useCreateTemplate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await create(formData.name, formData.description);
      setFormData({ name: "", description: "" });
      setShowForm(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Templates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          <Plus size={20} />
          New Template
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Template</h2>
          {(error || createError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error || createError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Template Name
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

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Template"}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates && templates.length > 0 ? (
          templates.map((template) => (
            <div
              key={template.id}
              className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-slate-900 flex-1">{template.name}</h3>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-3">{template.description}</p>
              <div className="text-xs text-slate-500">
                {template.fields?.length || 0} fields
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-600">
            <p>No templates yet. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
