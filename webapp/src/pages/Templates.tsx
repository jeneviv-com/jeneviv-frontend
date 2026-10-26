import { useState } from "react";
import { LayoutTemplate, Plus, Save, Trash2 } from "lucide-react";
import { templatesAPI, type CollectionField, type Template } from "@/lib/api";
import { useAction, useTemplates } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/format";
import FieldEditor from "@/components/FieldEditor";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  InlineNote,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  SegmentedControl,
  TableSkeleton,
  Textarea,
  TONE_MEANING,
} from "@/components/ui";

export default function Templates() {
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const templates = useTemplates(scope);
  const { success, error: toastError } = useToast();

  const createTemplate = useAction((name: string, description: string) =>
    templatesAPI.create(name, description),
  );
  const removeTemplate = useAction((id: string) => templatesAPI.delete(id));
  const saveFields = useAction((id: string, fields: CollectionField[]) =>
    templatesAPI.setFields(id, fields),
  );
  const renameTemplate = useAction((id: string, data: Partial<Template>) =>
    templatesAPI.update(id, data),
  );

  const rows = (templates.data ?? []).filter((template) =>
    search.trim()
      ? template.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (template.description ?? "").toLowerCase().includes(search.trim().toLowerCase())
      : true,
  );

  const submitCreate = async () => {
    if (form.name.trim().length < 2) return;
    try {
      const result = await createTemplate.run(form.name.trim(), form.description.trim());
      success("Template created", "Add the payer fields you want to reuse.");
      setShowCreate(false);
      setForm({ name: "", description: "" });
      setEditing(result.template);
    } catch (err) {
      toastError("Could not create template", err instanceof Error ? err.message : "");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Collect"
        title="Templates"
        description="Reusable payer forms. Start a collection from a template and skip the setup every term."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
            New template
          </Button>
        }
      />

      <div className="mb-6">
        <InlineNote tone="info" title="What a template does">
          A template stores the questions you ask payers — name, matric number,
          class, phone. Pick one when creating a collection and the fields are
          copied in, editable afterwards.
        </InlineNote>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3 border-b border-line pb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search templates"
          className="w-full sm:w-[280px]"
        />
        <SegmentedControl
          value={scope}
          onChange={setScope}
          options={[
            { value: "all", label: "All templates" },
            { value: "mine", label: "Created by me" },
          ]}
        />
        <span className="ml-auto font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
          {rows.length} template{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {templates.loading ? (
        <div className="py-4">
          <TableSkeleton rows={3} cols={3} />
        </div>
      ) : templates.error ? (
        <div className="py-6">
          <ErrorState message={templates.error} onRetry={templates.refetch} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate size={20} />}
          title={search ? "No templates match" : "No templates yet"}
          description={
            search
              ? "Try a different name."
              : "Create a template for the collections you run repeatedly — school fees, thrift, departmental levies."
          }
          action={
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
              Create a template
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((template) => {
            const fields = template.fields ?? [];
            return (
              <li key={template.id} className="dash-rise grid gap-4 py-6 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-[16px] font-bold tracking-tight">{template.name}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                        template.is_public ? TONE_MEANING.neutral : TONE_MEANING.people
                      }`}
                    >
                      {template.is_public ? "Shared" : "Private"}
                    </span>
                  </div>
                  <p className="muted mt-1.5">{template.description || "No description."}</p>

                  {fields.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {fields.slice(0, 6).map((field) => (
                        <li
                          key={field.field_id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[12px]"
                        >
                          <span className="font-semibold text-ink">{field.display_name}</span>
                          <span className="font-mono text-[10px] text-ink-muted">
                            {field.type.replace("_", " ")}
                          </span>
                          {field.required ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-label="required" />
                          ) : null}
                        </li>
                      ))}
                      {fields.length > 6 ? (
                        <li className="self-center text-[12px] text-ink-muted">+{fields.length - 6} more</li>
                      ) : null}
                    </ul>
                  ) : (
                    <p className="mt-4 text-[12.5px] text-ink-muted">
                      No fields yet — open the template to add them.
                    </p>
                  )}

                  <p className="mt-4 font-mono text-[11px] text-ink-muted">
                    updated {formatDate(template.updated_at || template.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2 lg:justify-end">
                  <Button variant="secondary" size="sm" onClick={() => setEditing(template)}>
                    Edit fields
                  </Button>
                  <button
                    type="button"
                    aria-label={`Delete ${template.name}`}
                    onClick={() => setPendingDelete(template)}
                    className="grid h-9 w-9 place-items-center rounded-[10px] text-danger transition-colors hover:bg-[#fdecea]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New template"
        description="Name it after the collection you run most often."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              loading={createTemplate.loading}
              disabled={form.name.trim().length < 2}
              onClick={submitCreate}
            >
              Create template
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Template name" htmlFor="template-name">
            <Input
              id="template-name"
              value={form.name}
              placeholder="e.g. University levy"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Description" htmlFor="template-description">
            <Textarea
              id="template-description"
              value={form.description}
              placeholder="What this template is for."
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `${editing.name} · payer fields` : "Payer fields"}
        description="These fields are copied into any collection created from this template."
        width={720}
      >
        {editing ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Template name" htmlFor="edit-template-name">
                <Input
                  id="edit-template-name"
                  value={editing.name}
                  onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                />
              </Field>
              <Field label="Description" htmlFor="edit-template-description">
                <Input
                  id="edit-template-description"
                  value={editing.description ?? ""}
                  onChange={(event) => setEditing({ ...editing, description: event.target.value })}
                />
              </Field>
            </div>

            <FieldEditor
              fields={editing.fields ?? []}
              onChange={(fields) => setEditing({ ...editing, fields })}
              saving={saveFields.loading}
              onSave={async (fields) => {
                try {
                  await renameTemplate.run(editing.id, {
                    name: editing.name,
                    description: editing.description,
                  });
                  await saveFields.run(editing.id, fields);
                  await templates.refetch();
                  success("Template saved", `${editing.name} is up to date.`);
                  setEditing(null);
                } catch (err) {
                  toastError("Could not save", err instanceof Error ? err.message : "");
                }
              }}
              saveLabel="Save template"
            />

            <div className="flex items-center gap-2 text-[12px] text-ink-muted">
              <Save size={13} /> Changes apply to future collections only.
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name ?? "template"}?`}
        description="Collections already created from it keep their fields."
        confirmLabel="Delete template"
        destructive
        loading={removeTemplate.loading}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await removeTemplate.run(pendingDelete.id);
            success("Template deleted", `${pendingDelete.name} was removed.`);
            setPendingDelete(null);
          } catch (err) {
            toastError("Could not delete", err instanceof Error ? err.message : "");
          }
        }}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}
