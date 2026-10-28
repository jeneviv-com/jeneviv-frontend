import { useEffect, useMemo, useState } from "react";
import { HandCoins, ImagePlus, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { groupsAPI, type CollectionGroup } from "@/lib/api";
import { errorMessage, useAction, useGroups } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import LogoPicker from "@/components/LogoPicker";
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
  TableSkeleton,
  Textarea,
  TONE_MEANING,
  type ToneKind,
} from "@/components/ui";

type Draft = {
  id: string | null;
  name: string;
  description: string;
  logo_url: string | null;
};

const EMPTY_DRAFT: Draft = { id: null, name: "", description: "", logo_url: null };

/** One stacked summary tile, coloured by meaning. Matches the Collections page. */
function SummaryTile({
  index,
  tone,
  label,
  value,
  hint,
}: {
  index: number;
  tone: ToneKind;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div
      className="dash-rise relative -mt-6 first:mt-0 lg:mt-0"
      style={{ zIndex: index + 1, animationDelay: `${index * 90}ms` }}
    >
      <div
        className={`flex min-h-[108px] items-center justify-between gap-3 rounded-[20px] border border-ink/20 px-5 py-5 shadow-sm lg:min-h-[92px] lg:flex-col lg:items-start lg:px-6 ${TONE_MEANING[tone]}`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold tracking-tight lg:text-[18px]">{label}</p>
          <p className="mt-0.5 truncate text-[12.5px] opacity-70 lg:text-[13px]">{hint}</p>
        </div>
        <p className="tabular shrink-0 text-right text-[20px] font-bold lg:mt-2 lg:w-full lg:text-left lg:text-[28px]">
          {value}
        </p>
      </div>
    </div>
  );
}

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

  const all = groups.data ?? [];
  const totalCollections = all.reduce((sum, group) => sum + (group.collection_count ?? 0), 0);
  const withoutLogo = all.filter((group) => !group.logo_url).length;

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

      {/* summary: stacked tiles, one meaning each */}
      <div className="mb-6">
        <SummaryTile
          index={0}
          tone="people"
          label="Groups"
          value={String(all.length)}
          hint="Entities you collect for"
        />
        <SummaryTile
          index={1}
          tone="neutral"
          label="Grouped collections"
          value={String(totalCollections)}
          hint="Collections filed under a group"
        />
        <SummaryTile
          index={2}
          tone={withoutLogo ? "attention" : "neutral"}
          label="Without a logo"
          value={String(withoutLogo)}
          hint={withoutLogo ? "Add a logo so payers recognise them" : "Every group has a logo"}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
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
        <TableSkeleton rows={3} cols={2} />
      ) : groups.error ? (
        <ErrorState message={groups.error} onRetry={groups.refetch} />
      ) : rows.length === 0 ? (
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
      ) : (
        /* phones: cards tuck under each other; larger screens: a grid */
        <ul className="lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
          {rows.map((group, index) => {
            const hasLogo = Boolean(group.logo_url);
            const tone: ToneKind = hasLogo ? "neutral" : "attention";
            const count = group.collection_count ?? 0;

            return (
              <li
                key={group.id}
                className="dash-rise relative -mt-5 first:mt-0 lg:mt-0"
                style={{ zIndex: index + 1, animationDelay: `${Math.min(index, 6) * 60}ms` }}
              >
                <article
                  className={`flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-ink/20 p-5 shadow-sm ${TONE_MEANING[tone]}`}
                >
                  {/* identity */}
                  <div className="flex items-start gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-white/85">
                      {group.logo_url ? (
                        <img src={group.logo_url} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <ImagePlus size={18} className="text-ink-soft" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-semibold tracking-tight">{group.name}</p>
                      <p className="mt-1 line-clamp-2 break-words text-[12.5px] leading-relaxed opacity-75">
                        {group.description || "No description added."}
                      </p>
                    </div>
                  </div>

                  {/* figures */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[14px] bg-white/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-[12.5px] font-semibold">
                      <HandCoins size={14} aria-hidden="true" />
                      {count} {count === 1 ? "collection" : "collections"}
                    </div>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] opacity-75">
                      {hasLogo ? "Logo set" : "No logo yet"}
                    </span>
                  </div>

                  {/* actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          id: group.id,
                          name: group.name,
                          description: group.description ?? "",
                          logo_url: group.logo_url ?? null,
                        })
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-ink px-3.5 text-[12.5px] font-semibold text-white transition-transform duration-150 active:scale-[0.97]"
                    >
                      <Pencil size={13} aria-hidden="true" /> Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${group.name}`}
                      onClick={() => setPendingDelete(group)}
                      className="ml-auto grid h-9 w-9 place-items-center rounded-[10px] bg-white/75 text-danger transition-colors hover:bg-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
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
