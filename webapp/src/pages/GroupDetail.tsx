import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Download,
  ExternalLink,
  FileText,
  ImagePlus,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { collectionsAPI, groupsAPI, type Collection, type CollectionGroup } from "@/lib/api";
import { useAction, useCollectionStats, useGroup } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import {
  copyText,
  formatDate,
  formatMoney,
  formatNumber,
  paymentLink,
  percent,
  timeAgo,
  transactionPayer,
} from "@/lib/format";
import LogoPicker from "@/components/LogoPicker";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  PageHeader,
  Pill,
  ProgressBar,
  SearchInput,
  SegmentedControl,
  TableSkeleton,
  Textarea,
  Tabs,
  Toggle,
  TONE_CARD,
  type ToneCardTone,
} from "@/components/ui";

type Tab = "overview" | "collections" | "settings";

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [collectionStatus, setCollectionStatus] = useState<"all" | "active" | "paused">("all");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const group = useGroup(id);
  const collections = useCollectionStats();

  const updateGroup = useAction((groupId: string, data: Partial<CollectionGroup>) =>
    groupsAPI.update(groupId, data),
  );
  const removeGroup = useAction((groupId: string) => groupsAPI.delete(groupId));

  const data = group.data;
  const collectionsLoading = collections.loading;

  /* The list endpoint has no server-side group filter, so membership and the
     status chip are applied here — the same client-side style the Collections
     page uses. */
  const collectionsData = useMemo(
    () =>
      (collections.data ?? []).filter(
        (collection) =>
          collection.group_id === id &&
          (collectionStatus === "all" ||
            (collectionStatus === "active") === Boolean(collection.is_active)),
      ),
    [collections.data, id, collectionStatus],
  );

  const [form, setForm] = useState({
    name: "",
    description: "",
    logo_url: null as string | null,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      description: data.description ?? "",
      logo_url: data.logo_url ?? null,
    });
  }, [data]);

  const filteredCollections = useMemo(() => {
    if (!search.trim()) return collectionsData;
    const needle = search.trim().toLowerCase();
    return collectionsData.filter(
      (collection) =>
        collection.name.toLowerCase().includes(needle) ||
        collection.short_code.toLowerCase().includes(needle),
    );
  }, [collectionsData, search]);

  const totals = useMemo(() => {
    const collected = collectionsData.reduce(
      (sum, collection) => sum + (collection.stats?.collected ?? 0),
      0,
    );
    const payers = collectionsData.reduce(
      (sum, collection) => sum + (collection.stats?.paid ?? 0),
      0,
    );
    const pending = collectionsData.reduce(
      (sum, collection) => sum + (collection.stats?.pending ?? 0),
      0,
    );

    return { collected, payers, pending, count: collectionsData.length };
  }, [collectionsData]);

  const saveChanges = async () => {
    if (!data) return;
    try {
      await updateGroup.run(data.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        logo_url: form.logo_url,
      });
      await group.refetch();
      success("Group updated", `${form.name} was saved.`);
      setEditing(false);
    } catch (err) {
      toastError("Could not update group", err instanceof Error ? err.message : "");
    }
  };

  const deleteGroup = async () => {
    if (!data) return;
    try {
      await removeGroup.run(data.id);
      success("Group deleted", `${data.name} was removed.`);
      navigate("/groups");
    } catch (err) {
      toastError("Could not delete group", err instanceof Error ? err.message : "");
    }
  };

  if (group.error) {
    return (
      <div className="space-y-4">
        <Link
          to="/groups"
          className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} /> All groups
        </Link>
        <Card>
          <ErrorState message={group.error} onRetry={group.refetch} />
        </Card>
      </div>
    );
  }

  if (group.loading || !data) {
    return (
      <div className="space-y-4">
        <Link
          to="/groups"
          className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} /> All groups
        </Link>
        <Card>
          <TableSkeleton rows={6} cols={4} />
        </Card>
      </div>
    );
  }

  const hasLogo = Boolean(data.logo_url);
  const summaryTones: ToneCardTone[] = ["lavender", "mint", "peach", "aqua"];

  return (
    <>
      <Link
        to="/groups"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} /> All groups
      </Link>

      {/* Header */}
      <header className="dash-rise mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[16px] border border-ink/15 bg-cream">
            {data.logo_url ? (
              <img src={data.logo_url} alt="" className="h-full w-full object-contain" />
            ) : (
              <ImagePlus size={24} className="text-ink-soft" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <h1 className="text-[24px] font-extrabold tracking-tight sm:text-[28px]">
              {data.name}
            </h1>
            <p className="muted mt-2 max-w-2xl">
              {data.description || "No description yet — add one to describe this group."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
              <span>created · {formatDate(data.created_at)}</span>
              <span>collections · {formatNumber(totals.count)}</span>
              <span>{hasLogo ? "Logo set" : "No logo"}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button
            variant="secondary"
            icon={<Pencil size={14} />}
            onClick={() => setEditing(true)}
          >
            Edit group
          </Button>
          <Link to="/collections?new=1" className="btn btn-primary">
            <Plus size={15} /> New collection
          </Link>
        </div>
      </header>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "collections", label: `Collections (${totals.count})` },
          { value: "settings", label: "Settings" },
        ]}
      />

      <div className="mt-5">
        {tab === "overview" ? (
          <div className="space-y-14">
            {/* Summary tiles */}
            <div className="pt-1 lg:grid lg:grid-cols-2 lg:gap-4">
              <div className="dash-rise relative -mt-6 first:mt-0 lg:mt-0">
                <div className={`flex min-h-[138px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm lg:min-h-[92px] lg:flex-col lg:items-start lg:px-6 lg:py-5 ${TONE_CARD.lavender}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold tracking-tight lg:text-[18px]">
                      Collections
                    </p>
                    <p className="mt-0.5 truncate text-[12.5px] opacity-70 lg:text-[13px]">
                      Filed under this group
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-[20px] font-bold tabular lg:mt-2 lg:w-full lg:text-left lg:text-[28px]">
                    {formatNumber(totals.count)}
                  </p>
                </div>
              </div>
              
              <div className="dash-rise relative -mt-6 first:mt-0 lg:mt-0">
                <div className={`flex min-h-[138px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm lg:min-h-[92px] lg:flex-col lg:items-start lg:px-6 lg:py-5 ${TONE_CARD.mint}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold tracking-tight lg:text-[18px]">
                      Collected
                    </p>
                    <p className="mt-0.5 truncate text-[12.5px] opacity-70 lg:text-[13px]">
                      Across all collections
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-[20px] font-bold tabular lg:mt-2 lg:w-full lg:text-left lg:text-[28px]">
                    {formatMoney(totals.collected)}
                  </p>
                </div>
              </div>

              <div className="dash-rise relative -mt-6 first:mt-0 lg:mt-0">
                <div className={`flex min-h-[138px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm lg:min-h-[92px] lg:flex-col lg:items-start lg:px-6 lg:py-5 ${TONE_CARD.peach}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold tracking-tight lg:text-[18px]">
                      Payers
                    </p>
                    <p className="mt-0.5 truncate text-[12.5px] opacity-70 lg:text-[13px]">
                      Successful payments
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-[20px] font-bold tabular lg:mt-2 lg:w-full lg:text-left lg:text-[28px]">
                    {formatNumber(totals.payers)}
                  </p>
                </div>
              </div>

              <div className="dash-rise relative -mt-6 first:mt-0 lg:mt-0">
                <div className={`flex min-h-[138px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm lg:min-h-[92px] lg:flex-col lg:items-start lg:px-6 lg:py-5 ${TONE_CARD.aqua}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold tracking-tight lg:text-[18px]">
                      Completion
                    </p>
                    <p className="mt-0.5 truncate text-[12.5px] opacity-70 lg:text-[13px]">
                      {totals.pending} pending transfers
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-[20px] font-bold tabular lg:mt-2 lg:w-full lg:text-left lg:text-[28px]">
                    {percent(totals.payers, Math.max(1, totals.payers + totals.pending))}%
                  </p>
                </div>
              </div>
            </div>

            {/* Recent collections */}
            <section>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
                    Recent collections
                  </p>
                  <h2 className="mt-2 text-[22px] font-bold tracking-[-0.03em]">
                    {filteredCollections.length} in this group
                  </h2>
                </div>
                <Link to="/collections?new=1" className="btn btn-primary btn-sm">
                  <Plus size={13} /> New collection
                </Link>
              </div>

              {collectionsLoading ? (
                <TableSkeleton rows={4} cols={3} />
              ) : filteredCollections.length === 0 ? (
                <EmptyState
                  icon={<Layers size={20} />}
                  title="No collections in this group"
                  description="Create a collection and assign it to this group to see it here."
                  action={
                    <Link to="/collections?new=1" className="btn btn-primary btn-sm">
                      <Plus size={14} /> Create a collection
                    </Link>
                  }
                />
              ) : (
                <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredCollections.slice(0, 6).map((collection, index) => {
                    const paid = collection.stats?.paid ?? 0;
                    const collected = collection.stats?.collected ?? 0;
                    const pending = collection.stats?.pending ?? 0;

                    return (
                      <li
                        key={collection.id}
                        className="dash-rise"
                        style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
                      >
                        <Link
                          to={`/collections/${collection.id}`}
                          className="card card-interactive flex h-full flex-col rounded-[18px] border-ink/20 p-5 no-underline hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[15.5px] font-semibold tracking-tight">
                                {collection.name}
                              </p>
                              <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted">
                                {collection.description || "No description added."}
                              </p>
                            </div>
                            <span
                              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] ${
                                collection.is_active
                                  ? "bg-ink text-cream"
                                  : "border border-ink/20 bg-cream text-ink-soft"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${collection.is_active ? "bg-cream" : "bg-ink-faint"}`}
                              />
                              {collection.is_active ? "Accepting" : "Paused"}
                            </span>
                          </div>

                          <div className="mt-5 flex items-end justify-between gap-4 border-b border-line-soft pb-4">
                            <div className="min-w-0">
                              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                                Per payer
                              </p>
                              <p className="tabular mt-1.5 truncate text-[25px] font-bold leading-none tracking-[-0.03em]">
                                {formatMoney(collection.amount, collection.currency)}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                                Collected
                              </p>
                              <p className="tabular mt-1.5 text-[15px] font-bold">
                                {formatMoney(collected, collection.currency)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[12.5px] text-ink-muted">
                                {paid} {paid === 1 ? "payer" : "payers"}
                                {pending > 0 ? ` · ${pending} pending` : ""}
                              </p>
                              <p className="tabular font-mono text-[11.5px] text-ink-muted">
                                {formatMoney(collected, collection.currency)}
                              </p>
                            </div>
                            <div className="mt-2.5">
                              <ProgressBar
                                value={percent(paid, Math.max(1, paid + pending))}
                                tone="ink"
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-2 border-t border-line-soft pt-4">
                            <Link
                              to={`/collections/${collection.id}`}
                              className="btn btn-primary btn-sm"
                            >
                              Open <ExternalLink size={13} />
                            </Link>
                            <p className="font-mono text-[11px] text-ink-muted">
                              {collection.short_code}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}

              {filteredCollections.length > 6 && (
                <div className="mt-6 text-center">
                  <Link
                    to={`/collections?group=${data.id}`}
                    className="text-[13px] font-semibold text-brand hover:text-brand-dark"
                  >
                    View all {filteredCollections.length} collections in this group →
                  </Link>
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "collections" ? (
          <section>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search collections"
                className="w-full sm:w-[300px]"
              />
              <SegmentedControl
                value={collectionStatus}
                onChange={setCollectionStatus}
                options={[
                  { value: "all", label: "All" },
                  { value: "active", label: "Accepting" },
                  { value: "paused", label: "Paused" },
                ]}
              />
              <span className="ml-auto font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
                {filteredCollections.length} shown
              </span>
            </div>

            {collectionsLoading ? (
              <Card>
                <TableSkeleton rows={6} cols={4} />
              </Card>
            ) : filteredCollections.length === 0 ? (
              <EmptyState
                icon={<Layers size={20} />}
                title={
                  search || collectionStatus !== "all"
                    ? "No collections match your filters"
                    : "No collections in this group yet"
                }
                description={
                  search || collectionStatus !== "all"
                    ? "Try a different search or clear the filters."
                    : "Create a collection and assign it to this group to see it here."
                }
                action={
                  <Link to="/collections?new=1" className="btn btn-primary btn-sm">
                    <Plus size={14} /> Create a collection
                  </Link>
                }
              />
            ) : (
              <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {filteredCollections.map((collection, index) => {
                  const paid = collection.stats?.paid ?? 0;
                  const collected = collection.stats?.collected ?? 0;
                  const pending = collection.stats?.pending ?? 0;

                  return (
                    <li
                      key={collection.id}
                      className="dash-rise"
                      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
                    >
                      <Link
                        to={`/collections/${collection.id}`}
                        className="card card-interactive flex h-full flex-col rounded-[18px] border-ink/20 p-5 no-underline hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[15.5px] font-semibold tracking-tight">
                              {collection.name}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted">
                              {collection.description || "No description added."}
                            </p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] ${
                              collection.is_active
                                ? "bg-ink text-cream"
                                : "border border-ink/20 bg-cream text-ink-soft"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${collection.is_active ? "bg-cream" : "bg-ink-faint"}`}
                            />
                            {collection.is_active ? "Accepting" : "Paused"}
                          </span>
                        </div>

                        <div className="mt-5 flex items-end justify-between gap-4 border-b border-line-soft pb-4">
                          <div className="min-w-0">
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                              Per payer
                            </p>
                            <p className="tabular mt-1.5 truncate text-[25px] font-bold leading-none tracking-[-0.03em]">
                              {formatMoney(collection.amount, collection.currency)}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                              Collected
                            </p>
                            <p className="tabular mt-1.5 text-[15px] font-bold">
                              {formatMoney(collected, collection.currency)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[12.5px] text-ink-muted">
                              {paid} {paid === 1 ? "payer" : "payers"}
                              {pending > 0 ? ` · ${pending} pending` : ""}
                            </p>
                            <p className="tabular font-mono text-[11.5px] text-ink-muted">
                              {formatMoney(collected, collection.currency)}
                            </p>
                          </div>
                          <div className="mt-2.5">
                            <ProgressBar
                              value={percent(paid, Math.max(1, paid + pending))}
                              tone="ink"
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line-soft pt-4">
                          <Link
                            to={`/collections/${collection.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            Open <ExternalLink size={13} />
                          </Link>
                          <p className="font-mono text-[11px] text-ink-muted">
                            {collection.short_code}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}

        {tab === "settings" ? (
          <div className="grid gap-12 xl:grid-cols-[1.4fr_1fr]">
            {/* Edit group */}
            <section>
              <div className="mb-7">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
                  Edit group
                </p>
                <h2 className="mt-2 text-[24px] font-bold tracking-[-0.03em]">Group details</h2>
                <p className="muted mt-1.5">
                  Changes affect all collections filed under this group.
                </p>
              </div>

              <div className="space-y-5">
                <Field label="Group name" htmlFor="group-name">
                  <Input
                    id="group-name"
                    className="h-[50px] rounded-[12px]"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="e.g. Kings College Lagos"
                  />
                </Field>
                <Field label="Description" htmlFor="group-description">
                  <Textarea
                    id="group-description"
                    className="rounded-[12px]"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Senior secondary school fees and levies."
                  />
                </Field>

                <LogoPicker value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} />

                <div className="pt-2">
                  <Button
                    size="lg"
                    className="h-[50px] rounded-[12px] px-7"
                    icon={<Pencil size={14} />}
                    loading={updateGroup.loading}
                    onClick={saveChanges}
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </section>

            {/* Danger zone */}
            <aside className="self-start rounded-[20px] bg-[#ffd6cf] p-6">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
                Danger zone
              </p>
              <h3 className="mt-2 text-[18px] font-bold tracking-tight">Delete this group</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
                Collections filed under this group will be kept but will no longer show the group
                name and logo. The group itself and its logo will be permanently removed.
              </p>
              <Button
                variant="danger"
                className="mt-5 rounded-[12px]"
                icon={<Trash2 size={14} />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete group
              </Button>
            </aside>
          </div>
        ) : null}
      </div>

      {/* Edit modal */}
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit group"
        description="Changes apply to all collections filed under this group."
        width={560}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button loading={updateGroup.loading} onClick={saveChanges}>
              Save group
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Group name" htmlFor="edit-group-name">
            <Input
              id="edit-group-name"
              value={form.name}
              placeholder="e.g. Kings College Lagos"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Description" htmlFor="edit-group-description">
            <Textarea
              id="edit-group-description"
              value={form.description}
              placeholder="Senior secondary school fees and levies."
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
          <LogoPicker value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} />
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${data.name}?`}
        description="Collections filed under this group will be kept but will no longer show the group name and logo."
        confirmLabel="Delete group"
        destructive
        loading={removeGroup.loading}
        onConfirm={deleteGroup}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}