import { useState } from "react";
import { LayoutTemplate, Plus, Save, Trash2 } from "lucide-react";
import { templatesAPI, type CollectionField, type Template } from "@/lib/api";
import { useAction, useTemplates } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/format";
import FieldEditor from "@/components/FieldEditor";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  InlineNote,
  Input,
  Modal,
  PageHeader,
  Pill,
  SearchInput,
  SegmentedControl,
  TableSkeleton,
  Textarea,
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
        (template.description ?? "")
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      : true,
  );

  const submitCreate = async () => {
    if (form.name.trim().length < 2) return;
    try {
      const result = await createTemplate.run(
        form.name.trim(),
        form.description.trim(),
      );
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

      <InlineNote tone="info" title="What a template does">
        A template stores the questions you ask payers — name, matric number,
        class, phone. Pick one when creating a collection and the fields are
        copied in, editable afterwards.
      </InlineNote>

      <div className="mt-5 flex flex-wrap items-center gap-3">
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
        <Card padded={false} className="mt-4">
          <TableSkeleton rows={3} cols={3} />
        </Card>
      ) : templates.error ? (
        <Card className="mt-4">
          <ErrorState message={templates.error} onRetry={templates.refetch} />
        </Card>
      ) : rows.length === 0 ? (
        <Card className="mt-4">
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
        </Card>
      ) : (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {rows.map((template) => (
            <li key={template.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[14.5px] font-bold tracking-tight">
                      {template.name}
                    </h2>
                    <p className="muted mt-1">{template.description || "No description."}</p>
                  </div>
                  <Pill tone={template.is_public ? "blue" : "neutral"}>
                    {template.is_public ? "Shared" : "Private"}
                  </Pill>
                </div>

                <ul className="mt-4 space-y-1.5">
                  {(template.fields ?? []).slice(0, 5).map((field) => (
                    <li
                      key={field.field_id}
                      className="flex items-center justify-between gap-3 text-[12.5px]"
                    >
                      <span className="text-ink-soft">{field.display_name}</span>
                      <span className="font-mono text-3xs text-ink-muted">
                        {field.type.replace("_", " ")}
                        {field.required ? " · required" : ""}
                      </span>
                    </li>
                  ))}
                  {(template.fields?.length ?? 0) === 0 ? (
                    <li className="text-[12.5px] text-ink-muted">
                      No fields yet — open the template to add them.
                    </li>
                  ) : null}
                </ul>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
                  <span className="font-mono text-3xs text-ink-muted">
                    updated {formatDate(template.updated_at || template.created_at)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditing(template)}
                    >
                      Edit fields
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-[#fdecea]"
                      icon={<Trash2 size={13} />}
                      onClick={() => setPendingDelete(template)}
                      aria-label={`Delete ${template.name}`}
                    />
                  </div>
                </div>
              </Card>
            </li>
          ))}
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
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                />
              </Field>
              <Field label="Description" htmlFor="edit-template-description">
                <Input
                  id="edit-template-description"
                  value={editing.description ?? ""}
                  onChange={(event) =>
                    setEditing({ ...editing, description: event.target.value })
                  }
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
