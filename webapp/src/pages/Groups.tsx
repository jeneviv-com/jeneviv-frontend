import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { groupsAPI, type CollectionGroup } from "@/lib/api";
import { errorMessage, useAction, useGroups } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import LogoPicker from "@/components/LogoPicker";
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
  SearchInput,
  TableSkeleton,
  Textarea,
  TONE_CARD,
} from "@/components/ui";

type Draft = {
  id: string | null;
  name: string;
  description: string;
  logo_url: string | null;
};

const EMPTY_DRAFT: Draft = { id: null, name: "", description: "", logo_url: null };

export default function Groups() {
  const { success, error: toastError } = useToast();
  const groups = useGroups();

  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CollectionGroup | null>(null);

  const save = useAction((draft: Draft) => {
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      logo_url: draft.logo_url,
    };
    return draft.id ? groupsAPI.update(draft.id, payload) : groupsAPI.create(payload);
  });
  const remove = useAction((id: string) => groupsAPI.delete(id));

  const rows = useMemo(() => {
    const list = groups.data ?? [];
    if (!search.trim()) return list;
    const needle = search.trim().toLowerCase();
    return list.filter(
      (group) =>
        group.name.toLowerCase().includes(needle) ||
        (group.description ?? "").toLowerCase().includes(needle),
    );
  }, [groups.data, search]);

  // Keep the open editor in step with refreshed data (for example after a logo upload).
  useEffect(() => {
    if (!draft?.id) return;
    const fresh = (groups.data ?? []).find((group) => group.id === draft.id);
    if (fresh) setDraft({ ...draft, logo_url: fresh.logo_url ?? null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.data]);

  const submit = async () => {
    if (!draft) return;
    setFormError(null);
    if (draft.name.trim().length < 2) {
      setFormError("Give the group a name your payers will recognise.");
      return;
    }
    try {
      await save.run(draft);
      await groups.refetch();
      success(
        draft.id ? "Group updated" : "Group created",
        `${draft.name.trim()} can now be chosen when you create a collection.`,
      );
      setDraft(null);
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove.run(pendingDelete.id);
      await groups.refetch();
      success(
        "Group deleted",
        `${pendingDelete.name} was removed. Its collections were kept and are now ungrouped.`,
      );
      setPendingDelete(null);
    } catch (err) {
      toastError("Could not delete the group", errorMessage(err));
    }
  };

  const all = groups.data ?? [];
  const totalCollections = all.reduce((sum, group) => sum + (group.collection_count ?? 0), 0);
  const withoutLogo = all.filter((group) => !group.logo_url).length;

  return (
    <>
      <PageHeader
        eyebrow="Collect"
        title="Groups"
        description="Group collections under one entity, such as a school, a branch or a department, and give each one its own logo for payer pages and receipts."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setDraft({ ...EMPTY_DRAFT })}>
            New group
          </Button>
        }
      />

      {/* Summary: stacked on phones, a row on laptop, same as Collections */}
      <div className="mb-6 lg:grid lg:grid-cols-3 lg:gap-4">
        {[
          {
            tone: "lavender" as const,
            label: "Groups",
            value: String(all.length),
            hint: "Entities you collect for",
          },
          {
            tone: "mint" as const,
            label: "Grouped collections",
            value: String(totalCollections),
            hint: "Filed under a group",
          },
          {
            tone: "peach" as const,
            label: "Without a logo",
            value: String(withoutLogo),
            hint: withoutLogo ? "Add a logo so payers recognise them" : "Every group has a logo",
          },
        ].map((item, index) => (
          <div
            key={item.label}
            className="dash-rise relative -mt-5 first:mt-0 lg:mt-0"
            style={{ zIndex: index + 1, animationDelay: `${index * 90}ms` }}
          >
            <div
              className={`flex min-h-[108px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm lg:min-h-[92px] lg:flex-col lg:items-start lg:px-6 lg:py-5 ${TONE_CARD[item.tone]}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold tracking-tight lg:text-[18px]">
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-[12.5px] opacity-70 lg:text-[13px]">{item.hint}</p>
              </div>
              <p className="shrink-0 text-right text-[20px] font-bold tabular lg:mt-2 lg:w-full lg:text-left lg:text-[28px]">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters: same row as Collections */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or description"
          className="w-full sm:w-[280px]"
        />
        <span className="ml-auto font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
          {rows.length} shown
        </span>
      </div>

      {/* Group list: a grid on laptop, the same card as a collection */}
      {groups.loading ? (
        <Card>
          <TableSkeleton rows={3} cols={2} />
        </Card>
      ) : groups.error ? (
        <Card>
          <ErrorState message={groups.error} onRetry={groups.refetch} />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Layers size={20} />}
            title={search ? "No groups match that search" : "No groups yet"}
            description={
              search
                ? "Try a different name, or clear the search to see everything."
                : "Create a group for each school or organisation you collect for. Each one carries its own name and logo."
            }
            action={
              <Button icon={<Plus size={15} />} onClick={() => setDraft({ ...EMPTY_DRAFT })}>
                Create a group
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {rows.map((group, index) => {
            const hasLogo = Boolean(group.logo_url);
            const count = group.collection_count ?? 0;

            return (
              <li
                key={group.id}
                className="dash-rise"
                style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
              >
                <Link
                  to={`/groups/${group.id}`}
                  className="card card-interactive flex h-full flex-col rounded-[18px] border border-ink/15 p-5 no-underline hover:shadow-md"
                >
                  {/* Identity and logo status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[12px] border border-ink/15 bg-cream">
                        {group.logo_url ? (
                          <img src={group.logo_url} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <ImagePlus size={16} className="text-ink-soft" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[15.5px] font-semibold tracking-tight">{group.name}</p>
                        <p className="mt-1 line-clamp-2 break-words text-[12.5px] leading-relaxed text-ink-muted">
                          {group.description || "No description added."}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] ${
                        hasLogo ? "bg-ink text-cream" : "border border-ink/20 bg-cream text-ink-soft"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${hasLogo ? "bg-cream" : "bg-ink-faint"}`} />
                      {hasLogo ? "Logo set" : "No logo"}
                    </span>
                  </div>

                  {/* Figures: same spacing and labels as a collection's figures */}
                  <div className="mt-5 flex items-end justify-between gap-4 border-b border-line-soft pb-4">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                        Collections
                      </p>
                      <p className="tabular mt-1.5 text-[25px] font-bold leading-none tracking-[-0.03em]">
                        {count}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                        Payer logo
                      </p>
                      <p className="mt-1.5 text-[15px] font-bold">{hasLogo ? "Shown" : "Not yet"}</p>
                    </div>
                  </div>

                  {/* Actions: same row as a collection */}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-line-soft pt-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDraft({
                          id: group.id,
                          name: group.name,
                          description: group.description ?? "",
                          logo_url: group.logo_url ?? null,
                        });
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <Pencil size={13} aria-hidden="true" /> Edit
                    </button>

                    <button
                      type="button"
                      title="Delete group"
                      aria-label={`Delete ${group.name}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPendingDelete(group);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-[10px] border border-ink/20 bg-white text-danger transition-colors hover:border-danger/40 hover:bg-danger/5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit group" : "New group"}
        description="Collections filed under this group show its name and logo to payers."
        width={560}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button loading={save.loading} onClick={submit}>
              {draft?.id ? "Save group" : "Create group"}
            </Button>
          </>
        }
      >
        {draft ? (
          <div className="space-y-5">
            <Field label="Group name" htmlFor="group-name">
              <Input
                id="group-name"
                value={draft.name}
                placeholder="e.g. Kings College Lagos"
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </Field>

            <Field label="Description" htmlFor="group-description" hint="Optional. What this group collects for.">
              <Textarea
                id="group-description"
                value={draft.description}
                placeholder="Senior secondary school fees and levies."
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </Field>

            <LogoPicker value={draft.logo_url} onChange={(url) => setDraft({ ...draft, logo_url: url })} />

            {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}
            {save.error ? <InlineNote tone="error">{save.error}</InlineNote> : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name ?? "group"}?`}
        description="Its collections are kept. They simply stop showing this group's name and logo."
        confirmLabel="Delete group"
        destructive
        loading={remove.loading}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}