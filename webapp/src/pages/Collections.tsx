
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  CircleSlash,
  Copy,
  HandCoins,
  Layers,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";

import {
  collectionsAPI,
  type Collection,
  type CreateCollectionInput,
} from "@/lib/api";

import {
  useAction,
  useCollectionStats,
  useGroups,
  useTemplates,
  type CollectionWithStats,
} from "@/hooks/useApi";

import { useToast } from "@/context/ToastContext";

import {
  copyText,
  formatMoney,
  paymentLink,
  percent,
} from "@/lib/format";

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
  ProgressBar,
  SearchInput,
  SegmentedControl,
  Select,
  TableSkeleton,
  Textarea,
  Toggle,
  TONE_CARD,
} from "@/components/ui";

type CollectionStatus = "all" | "active" | "paused";

const createEmptyForm = () => ({
  name: "",
  description: "",
  amount: "",
  currency: "NGN",
  target_payers: "",
  template_id: "",
  group_id: "",
  is_active: true,
});

export default function Collections() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CollectionStatus>("all");
  const [showCreate, setShowCreate] = useState(
    params.get("new") === "1",
  );

  const [pendingDelete, setPendingDelete] =
    useState<Collection | null>(null);

  // Optimistic status updates while waiting for the server.
  const [overrides, setOverrides] = useState<
    Record<string, boolean>
  >({});

  const collections = useCollectionStats({
    status: status === "all" ? undefined : status,
  });

  const templates = useTemplates("all");
  const groups = useGroups();

  const createCollection = useAction(
    (input: CreateCollectionInput) =>
      collectionsAPI.create(input),
  );

  const removeCollection = useAction(
    (id: string) => collectionsAPI.delete(id),
  );

  const updateCollection = useAction(
    (id: string, data: Partial<Collection>) =>
      collectionsAPI.update(id, data),
  );

  const [form, setForm] = useState(createEmptyForm);
  const [formError, setFormError] = useState<string | null>(
    null,
  );

  // Open the create modal when ?new=1 is present.
  useEffect(() => {
    if (params.get("new") !== "1") return;

    setShowCreate(true);

    const nextParams = new URLSearchParams(params);
    nextParams.delete("new");

    setParams(nextParams, { replace: true });
  }, [params, setParams]);

  // Clear optimistic overrides after the server confirms changes.
  useEffect(() => {
    const list = (collections.data ?? []) as Collection[];

    setOverrides((current) => {
      const next = { ...current };
      let changed = false;

      for (const id of Object.keys(next)) {
        const row = list.find((item) => item.id === id);

        if (row && row.is_active === next[id]) {
          delete next[id];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [collections.data]);

  const rows = useMemo(() => {
    const list = (collections.data ??
      []) as CollectionWithStats[];

    const needle = search.trim().toLowerCase();

    if (!needle) return list;

    return list.filter(
      (collection) =>
        collection.name.toLowerCase().includes(needle) ||
        collection.short_code.toLowerCase().includes(needle),
    );
  }, [collections.data, search]);

  const totals = useMemo(() => {
    const list = (collections.data ??
      []) as CollectionWithStats[];

    const collected = list.reduce(
      (sum, collection) =>
        sum + (collection.stats?.collected ?? 0),
      0,
    );

    const payers = list.reduce(
      (sum, collection) =>
        sum + (collection.stats?.paid ?? 0),
      0,
    );

    return {
      collected,
      payers,
      count: list.length,
    };
  }, [collections.data]);

  const closeCreateModal = () => {
    setShowCreate(false);
    setFormError(null);
  };

  const submit = async () => {
    setFormError(null);

    const amount = Number(
      form.amount.replace(/[,\s]/g, ""),
    );

    if (form.name.trim().length < 2) {
      setFormError(
        "Give the collection a name your payers will recognise.",
      );
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError(
        "Enter the amount each payer should transfer.",
      );
      return;
    }

    try {
      const result = await createCollection.run({
        name: form.name.trim(),
        description: form.description.trim(),
        amount,
        currency: form.currency,
        template_id: form.template_id || undefined,
        group_id: form.group_id || null,
        is_active: form.is_active,
      });

      success(
        "Collection created",
        `${result.collection.name} is ready. Share its link with your group.`,
      );

      setShowCreate(false);
      setForm(createEmptyForm());

      navigate(`/collections/${result.collection.id}`);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Could not create the collection.",
      );
    }
  };

  const toggleActive = async (
    collection: CollectionWithStats,
  ) => {
    const current =
      overrides[collection.id] ?? collection.is_active;

    const next = !current;

    setOverrides((previous) => ({
      ...previous,
      [collection.id]: next,
    }));

    try {
      await updateCollection.run(collection.id, {
        is_active: next,
      });

      await collections.refetch();

      success(
        next ? "Collection resumed" : "Collection paused",
        `${collection.name} is now ${
          next
            ? "accepting payments"
            : "closed to new payments"
        }.`,
      );
    } catch (err) {
      setOverrides((previous) => {
        const rolledBack = { ...previous };
        delete rolledBack[collection.id];
        return rolledBack;
      });

      toastError(
        "Could not update the collection",
        err instanceof Error ? err.message : "",
      );
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await removeCollection.run(pendingDelete.id);

      success(
        "Collection deleted",
        `${pendingDelete.name} and its payments were removed.`,
      );

      setPendingDelete(null);
      await collections.refetch();
    } catch (err) {
      toastError(
        "Could not delete the collection",
        err instanceof Error ? err.message : "",
      );
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Collect"
        title="Collections"
        description="Each collection is one amount, one link, and a live list of who has paid."
        actions={
          <Button
            icon={<Plus size={15} />}
            onClick={() => {
              setFormError(null);
              setShowCreate(true);
            }}
          >
            New collection
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="mb-6 lg:grid lg:grid-cols-3 lg:gap-4">
        {[
          {
            tone: "lavender" as const,
            label: "Collections",
            value: String(totals.count),
            hint: "Active and paused",
          },
          {
            tone: "mint" as const,
            label: "Collected",
            value: formatMoney(totals.collected),
            hint: "Across all collections",
          },
          {
            tone: "peach" as const,
            label: "Payers",
            value: String(totals.payers),
            hint: "Successful payments",
          },
        ].map((item, index) => (
          <div
            key={item.label}
            className="dash-rise relative -mt-5 first:mt-0 lg:mt-0"
            style={{
              zIndex: index + 1,
              animationDelay: `${index * 90}ms`,
            }}
          >
            <div
              className={`flex min-h-[138px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm lg:min-h-[92px] lg:flex-col lg:items-start lg:px-6 lg:py-5 ${TONE_CARD[item.tone]}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold tracking-tight lg:text-[18px]">
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-[12.5px] opacity-70 lg:text-[13px]">
                  {item.hint}
                </p>
              </div>

              <p className="shrink-0 text-right text-[20px] font-bold tabular lg:mt-2 lg:w-full lg:text-left lg:text-[28px]">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or code"
          className="w-full sm:w-[280px]"
        />

        <SegmentedControl
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Accepting" },
            { value: "paused", label: "Paused" },
          ]}
        />

        <span className="ml-auto font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
          {rows.length} shown
        </span>
      </div>

      {/* Collection list */}
      {collections.loading ? (
        <Card>
          <TableSkeleton rows={5} cols={3} />
        </Card>
      ) : collections.error ? (
        <Card>
          <ErrorState
            message={collections.error}
            onRetry={collections.refetch}
          />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HandCoins size={20} />}
            title={
              search
                ? "No collections match that search"
                : "No collections yet"
            }
            description={
              search
                ? "Try a different name, or clear the search to see everything."
                : "Create your first collection: set the amount, decide what you need from each payer, and share the link."
            }
            action={
              <Button
                icon={<Plus size={15} />}
                onClick={() => {
                  setFormError(null);
                  setShowCreate(true);
                }}
              >
                Create a collection
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {rows.map((collection, index) => {
            const active =
              overrides[collection.id] ?? collection.is_active;

            const paid = collection.stats?.paid ?? 0;
            const collected =
              collection.stats?.collected ?? 0;
            const pending =
              collection.stats?.pending ?? 0;

            const target =
              (
                collection as {
                  target_payers?: number;
                }
              ).target_payers ?? 0;

            const progress = target
              ? percent(paid, target)
              : Math.min(100, paid);

            return (
              <li
                key={collection.id}
                className="dash-rise"
                style={{
                  animationDelay: `${Math.min(index, 6) * 60}ms`,
                }}
              >
                <article className="card card-interactive flex h-full flex-col rounded-[18px] border-ink/20 p-5">
                  {/* Title and status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/collections/${collection.id}`}
                        className="block truncate text-[15.5px] font-semibold tracking-tight underline-offset-2 hover:underline"
                      >
                        {collection.name}
                      </Link>

                      <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted">
                        {collection.description ||
                          "No description added."}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] ${
                        active
                          ? "bg-ink text-cream"
                          : "border border-ink/20 bg-cream text-ink-soft"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          active
                            ? "bg-cream"
                            : "bg-ink-faint"
                        }`}
                      />
                      {active ? "Accepting" : "Paused"}
                    </span>
                  </div>

                  {/* Figures */}
                  <div className="mt-5 flex items-end justify-between gap-4 border-b border-line-soft pb-4">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                        Per payer
                      </p>

                      <p className="tabular mt-1.5 truncate text-[25px] font-bold leading-none tracking-[-0.03em]">
                        {formatMoney(
                          collection.amount,
                          collection.currency,
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                        Collected
                      </p>

                      <p className="tabular mt-1.5 text-[15px] font-bold">
                        {formatMoney(
                          collected,
                          collection.currency,
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Payment progress */}
                  <div className="mt-4 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12.5px] text-ink-muted">
                        {paid} {paid === 1 ? "payer" : "payers"}
                        {target ? ` of ${target}` : ""}
                      </p>

                      <p className="tabular font-mono text-[11.5px] text-ink-muted">
                        {progress}%
                      </p>
                    </div>

                    <div className="mt-2.5">
                      <ProgressBar
                        value={progress}
                        tone="ink"
                      />
                    </div>

                    <p className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-ink-muted">
                      {collection.group ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2 py-0.5 text-ink-soft">
                          {collection.group.logo_url ? (
                            <img
                              src={collection.group.logo_url}
                              alt=""
                              className="h-3.5 w-3.5 rounded-full object-contain"
                            />
                          ) : (
                            <Layers
                              size={11}
                              aria-hidden="true"
                            />
                          )}

                          {collection.group.name}
                        </span>
                      ) : null}

                      <span>{collection.short_code}</span>

                      {pending > 0 ? (
                        <span>· {pending} pending</span>
                      ) : null}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-line-soft pt-4">
                    <Link
                      to={`/collections/${collection.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Open <ArrowUpRight size={13} />
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        title="Copy payment link"
                        aria-label={`Copy link for ${collection.name}`}
                        className="grid h-8 w-8 place-items-center rounded-[10px] border border-ink/20 bg-white text-ink-soft transition-colors hover:border-ink/40 hover:text-ink"
                        onClick={async () => {
                          const link = paymentLink(
                            collection.short_code,
                          );

                          const ok = await copyText(link);

                          if (ok) {
                            success(
                              "Payment link copied",
                              link,
                            );
                          }
                        }}
                      >
                        <Copy size={14} />
                      </button>

                      <button
                        type="button"
                        aria-label={
                          active
                            ? "Pause collection"
                            : "Resume collection"
                        }
                        disabled={updateCollection.loading}
                        onClick={() =>
                          toggleActive(collection)
                        }
                        className={`btn btn-sm ${
                          active
                            ? "btn-secondary"
                            : "btn-primary"
                        }`}
                      >
                        {active ? (
                          <Pause size={13} />
                        ) : (
                          <Play size={13} />
                        )}

                        {active ? "Pause" : "Resume"}
                      </button>

                      <button
                        type="button"
                        title="Delete collection"
                        aria-label={`Delete ${collection.name}`}
                        className="grid h-8 w-8 place-items-center rounded-[10px] border border-ink/20 bg-white text-danger transition-colors hover:border-danger/40 hover:bg-danger/5"
                        onClick={() =>
                          setPendingDelete(collection)
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {/* Create collection modal */}
      <Modal
        open={showCreate}
        onClose={closeCreateModal}
        title="Create a collection"
        description="One amount per payer. You can add more fields after you create it."
        width={560}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeCreateModal}
            >
              Cancel
            </Button>

            <Button
              loading={createCollection.loading}
              onClick={submit}
            >
              Create collection
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Collection name"
            htmlFor="collection-name"
          >
            <Input
              id="collection-name"
              value={form.name}
              placeholder="e.g. CSC 311 Handout"
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
            />
          </Field>

          <Field
            label="Description"
            htmlFor="collection-description"
            hint="Shown on the payment page so payers know what they are paying for."
          >
            <Textarea
              id="collection-description"
              value={form.description}
              placeholder="Course handout and past questions for 300 level."
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Amount per payer"
              htmlFor="collection-amount"
            >
              <Input
                id="collection-amount"
                inputMode="decimal"
                value={form.amount}
                placeholder="2500"
                onChange={(event) =>
                  setForm({
                    ...form,
                    amount: event.target.value,
                  })
                }
              />
            </Field>

            <Field
              label="Currency"
              htmlFor="collection-currency"
            >
              <Select
                id="collection-currency"
                value={form.currency}
                onChange={(event) =>
                  setForm({
                    ...form,
                    currency: event.target.value,
                  })
                }
              >
                <option value="NGN">NGN — Naira</option>
                <option value="USD">USD — Dollar</option>
              </Select>
            </Field>

            <Field
              label="Expected payers"
              htmlFor="collection-target"
              hint="Optional. Drives the progress bar."
            >
              <Input
                id="collection-target"
                inputMode="numeric"
                value={form.target_payers}
                placeholder="200"
                onChange={(event) =>
                  setForm({
                    ...form,
                    target_payers: event.target.value,
                  })
                }
              />
            </Field>
          </div>

          <Field
            label="Group (entity)"
            htmlFor="collection-group"
            hint="Payer pages and receipts show this group's name and logo."
          >
            <Select
              id="collection-group"
              value={form.group_id}
              onChange={(event) =>
                setForm({
                  ...form,
                  group_id: event.target.value,
                })
              }
            >
              <option value="">
                No group — use my workspace details
              </option>

              {(groups.data ?? []).map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </Field>

          {(groups.data ?? []).length === 0 ? (
            <InlineNote tone="info">
              Collecting for more than one school or organisation?{" "}
              <Link
                to="/groups"
                className="font-semibold underline underline-offset-2"
              >
                Create a group
              </Link>{" "}
              first, then pick it here.
            </InlineNote>
          ) : null}

          <Field
            label="Start from a template"
            htmlFor="collection-template"
            hint="Copies the payer fields from a template you have saved."
          >
            <Select
              id="collection-template"
              value={form.template_id}
              onChange={(event) =>
                setForm({
                  ...form,
                  template_id: event.target.value,
                })
              }
            >
              <option value="">
                No template — I will add fields myself
              </option>

              {(templates.data ?? []).map((template) => (
                <option
                  key={template.id}
                  value={template.id}
                >
                  {template.name} ·{" "}
                  {template.fields?.length ?? 0} fields
                </option>
              ))}
            </Select>
          </Field>

          <div className="rounded-[14px] border border-line bg-cream px-4 py-3">
            <Toggle
              checked={form.is_active}
              onChange={(value) =>
                setForm({
                  ...form,
                  is_active: value,
                })
              }
              label="Accept payments immediately"
              description="Turn this off to prepare the collection before payers can use the link."
            />
          </div>

          {formError ? (
            <InlineNote tone="error">
              {formError}
            </InlineNote>
          ) : null}

          {createCollection.error ? (
            <InlineNote tone="error">
              {createCollection.error}
            </InlineNote>
          ) : null}
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name ?? "collection"}?`}
        description="The payment link stops working immediately."
        confirmLabel="Delete collection"
        destructive
        loading={removeCollection.loading}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />

      {rows.length === 0 &&
      !collections.loading &&
      !collections.error ? (
        <p className="muted mt-5 flex items-center justify-center gap-2 text-center">
          <CircleSlash size={14} />
          Collections you create appear here with live payment counts.
        </p>
      ) : null}
    </>
  );
}
