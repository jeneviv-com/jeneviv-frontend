import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  CircleSlash,
  Copy,
  HandCoins,
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
  useTemplates,
  type CollectionWithStats,
} from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { copyText, formatMoney, paymentLink, percent } from "@/lib/format";
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
  type ToneCardTone,
} from "@/components/ui";

/** Accepting collections are mint, paused ones peach, so state reads at a glance. */
function toneFor(isActive: boolean): ToneCardTone {
  return isActive ? "mint" : "peach";
}

export default function Collections() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "paused">("all");
  const [showCreate, setShowCreate] = useState(params.get("new") === "1");
  const [pendingDelete, setPendingDelete] = useState<Collection | null>(null);
  // Instant card state after Pause / Resume, until the server list agrees.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const collections = useCollectionStats({ status: status === "all" ? undefined : status });
  const templates = useTemplates("all");

  const createCollection = useAction((input: CreateCollectionInput) =>
    collectionsAPI.create(input),
  );
  const removeCollection = useAction((id: string) => collectionsAPI.delete(id));
  const updateCollection = useAction((id: string, data: Partial<Collection>) =>
    collectionsAPI.update(id, data),
  );

  const [form, setForm] = useState({
    name: "",
    description: "",
    amount: "",
    currency: "NGN",
    target_payers: "",
    template_id: "",
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("new") === "1") {
      setShowCreate(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

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
    const list = (collections.data ?? []) as CollectionWithStats[];
    if (!search.trim()) return list;
    const needle = search.trim().toLowerCase();
    return list.filter(
      (collection) =>
        collection.name.toLowerCase().includes(needle) ||
        collection.short_code.toLowerCase().includes(needle),
    );
  }, [collections.data, search]);

  const totals = useMemo(() => {
    const list = (collections.data ?? []) as CollectionWithStats[];
    const collected = list.reduce(
      (sum, collection) => sum + (collection.stats?.collected ?? 0),
      0,
    );
    const payers = list.reduce(
      (sum, collection) => sum + (collection.stats?.paid ?? 0),
      0,
    );
    return { collected, payers, count: list.length };
  }, [collections.data]);

  const submit = async () => {
    setFormError(null);
    const amount = Number(form.amount.replace(/[,\s]/g, ""));
    if (form.name.trim().length < 2) {
      setFormError("Give the collection a name your payers will recognise.");
      return;
    }
    if (!amount || amount <= 0) {
      setFormError("Enter the amount each payer should transfer.");
      return;
    }

    try {
      const result = await createCollection.run({
        name: form.name.trim(),
        description: form.description.trim(),
        amount,
        currency: form.currency,
        template_id: form.template_id || undefined,
        is_active: form.is_active,
      });
      success(
        "Collection created",
        `${result.collection.name} is ready. Share its link with your group.`,
      );
      setShowCreate(false);
      setForm({
        name: "",
        description: "",
        amount: "",
        currency: "NGN",
        target_payers: "",
        template_id: "",
        is_active: true,
      });
      navigate(`/collections/${result.collection.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the collection.");
    }
  };

  const toggleActive = async (collection: Collection) => {
    const current = overrides[collection.id] ?? collection.is_active;
    const next = !current;
    setOverrides((o) => ({ ...o, [collection.id]: next }));
    try {
      await updateCollection.run(collection.id, { is_active: next });
      await collections.refetch();
      success(
        next ? "Collection resumed" : "Collection paused",
        `${collection.name} is now ${next ? "accepting payments" : "closed to new payments"}.`,
      );
    } catch (err) {
      setOverrides((o) => {
        const rolledBack = { ...o };
        delete rolledBack[collection.id];
        return rolledBack;
      });
      toastError("Could not update the collection", err instanceof Error ? err.message : "");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await removeCollection.run(pendingDelete.id);
      success("Collection deleted", `${pendingDelete.name} and its payments were removed.`);
      setPendingDelete(null);
    } catch (err) {
      toastError("Could not delete the collection", err instanceof Error ? err.message : "");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Collect"
        title="Collections"
        description="Each collection is one amount, one link, and a live list of who has paid."
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
            New collection
          </Button>
        }
      />

      {/* summary: the same stacked pastel cards as the dashboard */}
      <div className="mb-6">
        {[
          { tone: "lavender" as const, label: "Collections", value: String(totals.count), hint: "Active and paused" },
          { tone: "mint" as const, label: "Collected", value: formatMoney(totals.collected), hint: "Across all collections" },
          { tone: "peach" as const, label: "Payers", value: String(totals.payers), hint: "Successful payments" },
        ].map((item, index) => (
          <div
            key={item.label}
            className="dash-rise relative -mt-6 first:mt-0"
            style={{ zIndex: index + 1, animationDelay: `${index * 90}ms` }}
          >
            <div
              className={`flex min-h-[92px] items-center justify-between gap-3 rounded-[20px] border border-ink px-5 py-4 ${TONE_CARD[item.tone]}`}
            >
              <div className="min-w-0">
                <p className="text-[16px] font-semibold tracking-tight">{item.label}</p>
                <p className="mt-0.5 truncate text-[12.5px] opacity-70">{item.hint}</p>
              </div>
              <p className="shrink-0 text-right text-[20px] font-bold tabular">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* filters */}
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

      {/* collection list */}
      {collections.loading ? (
        <Card>
          <TableSkeleton rows={5} cols={3} />
        </Card>
      ) : collections.error ? (
        <Card>
          <ErrorState message={collections.error} onRetry={collections.refetch} />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HandCoins size={20} />}
            title={search ? "No collections match that search" : "No collections yet"}
            description={
              search
                ? "Try a different name, or clear the search to see everything."
                : "Create your first collection: set the amount, decide what you need from each payer, and share the link."
            }
            action={
              <Button icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
                Create a collection
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((collection, index) => {
            const active = overrides[collection.id] ?? active;
            const paid = collection.stats?.paid ?? 0;
            const collected = collection.stats?.collected ?? 0;
            const target = (collection as { target_payers?: number }).target_payers ?? 0;
            const progress = target ? percent(paid, target) : Math.min(100, paid);
            const tone = toneFor(active);

            return (
              <li
                key={collection.id}
                className="dash-rise"
                style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
              >
                <article
                  className={`rounded-[20px] border border-ink p-4 sm:p-5 ${TONE_CARD[tone]}`}
                >
                  {/* title row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/collections/${collection.id}`}
                        className="block truncate text-[16px] font-semibold tracking-tight hover:underline underline-offset-2"
                      >
                        {collection.name}
                      </Link>
                      <p className="mt-0.5 truncate text-[12.5px] opacity-70">
                        {collection.description || "No description added."}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/75 px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em]">
                      {active ? "Resumed" : "Paused"}
                    </span>
                  </div>

                  {/* figures */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-[14px] bg-white/60 p-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] opacity-65">
                        Per payer
                      </p>
                      <p className="tabular mt-0.5 truncate text-[13.5px] font-bold">
                        {formatMoney(collection.amount, collection.currency)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] opacity-65">
                        Collected
                      </p>
                      <p className="tabular mt-0.5 truncate text-[13.5px] font-bold">
                        {formatMoney(collected, collection.currency)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] opacity-65">
                        Payers
                      </p>
                      <p className="tabular mt-0.5 truncate text-[13.5px] font-bold">
                        {paid}
                        {target ? ` / ${target}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <ProgressBar
                      value={progress}
                      tone={active ? "brand" : "ink"}
                    />
                    <p className="mt-1.5 font-mono text-[11px] opacity-65">
                      {collection.short_code}
                      {collection.stats?.pending ? ` · ${collection.stats.pending} pending` : ""}
                    </p>
                  </div>

                  {/* actions */}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Link
                      to={`/collections/${collection.id}`}
                      className="inline-flex items-center gap-1.5 rounded-[10px] bg-ink px-3.5 py-2 text-[12.5px] font-semibold text-white transition-transform duration-150 active:scale-[0.97]"
                    >
                      Open <ArrowUpRight size={13} />
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        title="Copy payment link"
                        aria-label={`Copy link for ${collection.name}`}
                        className="grid h-9 w-9 place-items-center rounded-[10px] bg-white/75 transition-colors hover:bg-white"
                        onClick={async () => {
                          const ok = await copyText(paymentLink(collection.short_code));
                          if (ok) success("Payment link copied", paymentLink(collection.short_code));
                        }}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={active ? "Pause collection" : "Resume collection"}
                        disabled={updateCollection.loading}
                        onClick={() => toggleActive(collection)}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 ${
                          active
                            ? "bg-white/75 text-ink hover:bg-white"
                            : "bg-ink text-white hover:bg-black"
                        }`}
                      >
                        {active ? <Pause size={13} /> : <Play size={13} />}
                        {active ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        title="Delete collection"
                        aria-label={`Delete ${collection.name}`}
                        className="grid h-9 w-9 place-items-center rounded-[10px] bg-white/75 text-danger transition-colors hover:bg-white"
                        onClick={() => setPendingDelete(collection)}
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

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create a collection"
        description="One amount per payer. You can add more fields after you create it."
        width={560}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button loading={createCollection.loading} onClick={submit}>
              Create collection
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Collection name" htmlFor="collection-name">
            <Input
              id="collection-name"
              value={form.name}
              placeholder="e.g. CSC 311 Handout"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
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
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Amount per payer" htmlFor="collection-amount">
              <Input
                id="collection-amount"
                inputMode="decimal"
                value={form.amount}
                placeholder="2500"
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
              />
            </Field>
            <Field label="Currency" htmlFor="collection-currency">
              <Select
                id="collection-currency"
                value={form.currency}
                onChange={(event) => setForm({ ...form, currency: event.target.value })}
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
                onChange={(event) => setForm({ ...form, target_payers: event.target.value })}
              />
            </Field>
          </div>

          <Field
            label="Start from a template"
            htmlFor="collection-template"
            hint="Copies the payer fields from a template you have saved."
          >
            <Select
              id="collection-template"
              value={form.template_id}
              onChange={(event) => setForm({ ...form, template_id: event.target.value })}
            >
              <option value="">No template — I will add fields myself</option>
              {(templates.data ?? []).map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} · {template.fields?.length ?? 0} fields
                </option>
              ))}
            </Select>
          </Field>

          <div className="rounded-[14px] border border-line bg-cream px-4 py-3">
            <Toggle
              checked={form.is_active}
              onChange={(value) => setForm({ ...form, is_active: value })}
              label="Accept payments immediately"
              description="Turn this off to prepare the collection before payers can use the link."
            />
          </div>

          {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}
          {createCollection.error ? (
            <InlineNote tone="error">{createCollection.error}</InlineNote>
          ) : null}
        </div>
      </Modal>

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

      {rows.length === 0 && !collections.loading && !collections.error ? (
        <p className="muted mt-5 flex items-center justify-center gap-2 text-center">
          <CircleSlash size={14} /> Collections you create appear here with live
          payment counts.
        </p>
      ) : null}
    </>
  );
}
