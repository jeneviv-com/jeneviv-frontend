import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { CollectionField, FieldType } from "@/lib/api";
import { slugifyFieldId } from "@/lib/format";
import { Button, Field, Input, InlineNote, Select, Toggle } from "@/components/ui";

const TYPES: Array<{ value: FieldType; label: string }> = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone number" },
  { value: "select", label: "Single choice" },
  { value: "multiselect", label: "Multiple choice" },
  { value: "date", label: "Date" },
  { value: "image", label: "Image upload" },
  { value: "file", label: "File upload" },
];

export type DraftField = CollectionField & { id: string };

function newField(position: number): DraftField {
  return {
    id: `draft_${Math.random().toString(36).slice(2, 9)}`,
    position,
    display_name: "",
    field_id: "",
    type: "short_text",
    required: true,
  };
}

export default function FieldEditor({
  fields,
  onChange,
  saving,
  onSave,
  saveLabel = "Save fields",
}: {
  fields: CollectionField[];
  onChange: (fields: DraftField[]) => void;
  saving?: boolean;
  onSave?: (fields: DraftField[]) => void;
  saveLabel?: string;
}) {
  const [drafts, setDrafts] = useState<DraftField[]>(() =>
    fields.map((field, index) => ({
      ...field,
      id: field.id || `draft_${index}`,
      position: index,
    })),
  );

  // Sync from the parent only when the saved content really changes. Callers
  // often pass `x ?? []`, which is a new array on every render. Keying on the
  // content stops those re-renders from wiping fields the user just added.
  const fieldsKey = JSON.stringify(fields);
  useEffect(() => {
    setDrafts(
      fields.map((field, index) => ({
        ...field,
        id: field.id || `draft_${index}`,
        position: index,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldsKey]);

  const update = (next: DraftField[]) => {
    const normalised = next.map((field, index) => ({ ...field, position: index }));
    setDrafts(normalised);
    onChange(normalised);
  };

  const patch = (id: string, changes: Partial<DraftField>) => {
    update(drafts.map((field) => (field.id === id ? { ...field, ...changes } : field)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= drafts.length) return;
    const next = drafts.slice();
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  const duplicates = drafts
    .map((field) => field.field_id)
    .filter((id, index, all) => id && all.indexOf(id) !== index);

  const incomplete = drafts.filter(
    (field) => !field.display_name.trim() || !field.field_id.trim(),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="muted max-w-xl">
          These are the questions a payer answers on the payment page. Keep it
          short — every extra field costs you conversions.
        </p>
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => update([...drafts, newField(drafts.length)])}
        >
          Add field
        </Button>
      </div>

      {duplicates.length ? (
        <InlineNote tone="error" title="Duplicate field keys">
          Two fields share the same key ({[...new Set(duplicates)].join(", ")}).
          Keys must be unique so we can match payer data.
        </InlineNote>
      ) : null}

      {drafts.length === 0 ? (
        <div className="border-y border-dashed border-line py-10 text-center">
          <p className="text-[14px] font-bold tracking-tight">No payer fields yet</p>
          <p className="muted mx-auto mt-1.5 max-w-sm">
            Add at least a name and one identifier (matric number, member ID,
            phone) so every payment can be matched to the right person.
          </p>
        </div>
      ) : null}

      <ol className="divide-y divide-line">
        {drafts.map((field, index) => (
          <li key={field.id} className="grid gap-4 py-6 sm:grid-cols-[auto_1fr_auto] sm:gap-5">
            <span className="font-mono text-[12px] text-ink-muted sm:pt-2.5">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <Field label="Label shown to payers" htmlFor={`label-${field.id}`}>
                <Input
                  id={`label-${field.id}`}
                  value={field.display_name}
                  placeholder="e.g. Matric number"
                  onChange={(event) =>
                    patch(field.id, {
                      display_name: event.target.value,
                      field_id: field.field_id || slugifyFieldId(event.target.value || ""),
                    })
                  }
                />
              </Field>

              <Field label="Key" htmlFor={`key-${field.id}`} hint="Used in reports and API payloads.">
                <Input
                  id={`key-${field.id}`}
                  value={field.field_id}
                  placeholder="matric_number"
                  className="font-mono text-[12.5px]"
                  onChange={(event) =>
                    patch(field.id, { field_id: slugifyFieldId(event.target.value) })
                  }
                />
              </Field>

              <Field label="Type" htmlFor={`type-${field.id}`}>
                <Select
                  id={`type-${field.id}`}
                  value={field.type}
                  onChange={(event) => patch(field.id, { type: event.target.value as FieldType })}
                >
                  {TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </Field>

              {field.type === "select" || field.type === "multiselect" ? (
                <Field
                  label="Choices"
                  htmlFor={`options-${field.id}`}
                  hint="Separate each option with a comma."
                >
                  <Input
                    id={`options-${field.id}`}
                    value={(field.options || []).join(", ")}
                    placeholder="100, 200, 300, 400"
                    onChange={(event) =>
                      patch(field.id, {
                        options: event.target.value
                          .split(",")
                          .map((option) => option.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
              ) : null}

              <div className="sm:col-span-2">
                <Toggle
                  checked={field.required}
                  onChange={(value) => patch(field.id, { required: value })}
                  label="Required"
                  description="Payers must answer this before they can continue."
                />
              </div>
            </div>

            {/* quiet controls, grouped */}
            <div className="flex items-start gap-1 sm:flex-col">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="grid h-8 w-8 place-items-center rounded-[10px] text-ink-muted transition-colors hover:bg-cream hover:text-ink disabled:opacity-35"
                aria-label="Move up"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === drafts.length - 1}
                className="grid h-8 w-8 place-items-center rounded-[10px] text-ink-muted transition-colors hover:bg-cream hover:text-ink disabled:opacity-35"
                aria-label="Move down"
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => update(drafts.filter((item) => item.id !== field.id))}
                className="grid h-8 w-8 place-items-center rounded-[10px] text-danger transition-colors hover:bg-[#fdecea]"
                aria-label="Remove field"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ol>

      {onSave ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <Button
            loading={saving}
            disabled={incomplete.length > 0 || duplicates.length > 0}
            onClick={() => onSave(drafts)}
          >
            {saveLabel}
          </Button>
          {incomplete.length ? (
            <p className="text-[12px] text-ink-muted">
              {incomplete.length} field{incomplete.length > 1 ? "s" : ""} still need a label and a key.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
