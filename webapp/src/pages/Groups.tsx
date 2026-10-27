import { useEffect, useMemo, useState } from "react";
import { HandCoins, Layers, Pencil, Plus, Trash2 } from "lucide-react";
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
    return draft.id
      ? groupsAPI.update(draft.id, payload)
      : groupsAPI.create(payload);
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

  // Keep the open editor in step with refreshed data.
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

  const totalCollections = (groups.data ?? []).reduce(
    (sum, group) => sum + (group.collection_count ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        eyebrow="Collect"
        title="Groups"
        description="Group collections under one entity — a school, a branch, a department — and give that entity its own logo for payer pages and receipts."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setDraft({ ...EMPTY_DRAFT })}>
            New group
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">Groups</p>
            <p className="tabular mt-1 text-[22px] font-bold leading-none">
              {(groups.data ?? []).length}
            </p>
          </div>
          <Layers size={18} className="shrink-0 text-ink-muted" aria-hidden="true" />
        </Card>
        <Card className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">Grouped collections</p>
            <p className="tabular mt-1 text-[22px] font-bold leading-none">
              {totalCollections}
            </p>
          </div>
          <HandCoins size={18} className="shrink-0 text-ink-muted" aria-hidden="true" />
        </Card>
        <Card className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">Logos uploaded</p>
            <p className="tabular mt-1 text-[22px] font-bold leading-none">
              {(groups.data ?? []).filter((group) => group.logo_url).length}
            </p>
          </div>
          <Layers size={18} className="shrink-0 text-ink-muted" aria-hidden="true" />
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search groups"
          className="w-full sm:w-[280px]"
        />
        <span className="ml-auto font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
          {rows.length} shown
        </span>
      </div>

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
          {rows.map((group) => (
            <li key={group.id}>
              <article className="card card-interactive flex h-full flex-col rounded-[18px] border-ink/20 p-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-line bg-cream">
                    {group.logo_url ? (
                      <img src={group.logo_url} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <Layers size={18} className="text-ink-faint" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15.5px] font-semibold tracking-tight">
                      {group.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted">
                      {group.description || "No description added."}
                    </p>
                  </div>
                </div>

                <p className="mt-4 border-t border-line-soft pt-3 font-mono text-[11px] text-ink-muted">
                  {group.collection_count ?? 0}{" "}
                  {(group.collection_count ?? 0) === 1 ? "collection" : "collections"}
                  {group.logo_url ? "" : " · no logo yet"}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Pencil size={13} />}
                    onClick={() =>
                      setDraft({
                        id: group.id,
                        name: group.name,
                        description: group.description ?? "",
                        logo_url: group.logo_url ?? null,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-danger hover:bg-[#fdecea]"
                    icon={<Trash2 size={13} />}
                    onClick={() => setPendingDelete(group)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            </li>
          ))}
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

            <Field
              label="Description"
              htmlFor="group-description"
              hint="Optional — what this group collects for."
            >
              <Textarea
                id="group-description"
                value={draft.description}
                placeholder="Senior secondary school fees and levies."
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </Field>

            <LogoPicker
              value={draft.logo_url}
              onChange={(url) => setDraft({ ...draft, logo_url: url })}
            />

            {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}
            {save.error ? <InlineNote tone="error">{save.error}</InlineNote> : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name ?? "group"}?`}
        description="Its collections are kept — they simply stop showing this group's name and logo."
        confirmLabel="Delete group"
        destructive
        loading={remove.loading}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}
