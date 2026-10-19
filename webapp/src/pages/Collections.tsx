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
import {
  copyText,
  formatMoney,
  paymentLink,
  percent,
  statusTone,
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
  Pill,
  ProgressBar,
  SearchInput,
  SegmentedControl,
  Select,
  TableSkeleton,
  Textarea,
  Toggle,
} from "@/components/ui";

export default function Collections() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "paused">("all");
  const [showCreate, setShowCreate] = useState(params.get("new") === "1");
  const [pendingDelete, setPendingDelete] = useState<Collection | null>(null);

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
    try {
      await updateCollection.run(collection.id, { is_active: !collection.is_active });
      success(
        collection.is_active ? "Collection paused" : "Collection resumed",
        `${collection.name} is now ${collection.is_active ? "closed to new payments" : "accepting payments"}.`,
      );
    } catch (err) {
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

      <Card padded={false} className="mb-5">
        <div className="grid divide-y divide-line-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            ["Collections", String(totals.count), "Active and paused"],
            ["Collected", formatMoney(totals.collected), "Across all collections"],
            ["Payers", String(totals.payers), "Successful payments recorded"],
          ].map(([label, value, hint]) => (
            <div key={label} className="px-5 py-4">
              <p className="eyebrow">{label}</p>
              <p className="tabular mt-1.5 text-[22px] font-semibold tracking-tight">
                {value}
              </p>
              <p className="mt-0.5 text-[12px] text-ink-muted">{hint}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3">
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

        {collections.loading ? (
          <TableSkeleton rows={5} cols={3} />
        ) : collections.error ? (
          <ErrorState message={collections.error} onRetry={collections.refetch} />
        ) : rows.length === 0 ? (
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
        ) : (
          <ul className="divide-y divide-line-soft">
            {rows.map((collection) => {
              const paid = collection.stats?.paid ?? 0;
              const collected = collection.stats?.collected ?? 0;
              const target = (collection as { target_payers?: number }).target_payers ?? 0;
              const progress = target ? percent(paid, target) : Math.min(100, paid);
              return (
                <li
                  key={collection.id}
                  className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-cream/50 sm:flex-row sm:items-center sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/collections/${collection.id}`}
                        className="truncate text-[14px] font-semibold tracking-tight hover:text-brand-dark"
                      >
                        {collection.name}
                      </Link>
                      <Pill tone={statusTone(collection.is_active ? "active" : "paused")}>
                        {collection.is_active ? "Accepting" : "Paused"}
                      </Pill>
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
                      {collection.description || "No description added."}
                    </p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <span className="font-mono text-3xs text-ink-muted">
                        {collection.short_code}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-line" />
                      <span className="text-[11.5px] text-ink-muted">
                        {paid}
                        {target ? ` / ${target}` : ""} payers
                        {collection.stats?.pending
                          ? ` · ${collection.stats.pending} pending`
                          : ""}
                      </span>
                      <div className="hidden w-20 sm:block">
                        <ProgressBar
                          value={progress}
                          tone={collection.is_active ? "brand" : "ink"}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:justify-end">
                    <div className="min-w-[92px]">
                      <p className="eyebrow">Per payer</p>
                      <p className="tabular mt-0.5 text-[13px] font-semibold">
                        {formatMoney(collection.amount, collection.currency)}
                      </p>
                    </div>
                    <div className="min-w-[104px]">
                      <p className="eyebrow">Collected</p>
                      <p className="tabular mt-0.5 text-[13px] font-semibold text-success">
                        {formatMoney(collected, collection.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/collections/${collection.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Open <ArrowUpRight size={13} />
                      </Link>
                      <button
                        type="button"
                        title="Copy payment link"
                        aria-label={`Copy link for ${collection.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-cream hover:text-ink"
                        onClick={async () => {
                          const ok = await copyText(paymentLink(collection.short_code));
                          if (ok) success("Payment link copied", paymentLink(collection.short_code));
                        }}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        title={collection.is_active ? "Pause collection" : "Resume collection"}
                        aria-label={collection.is_active ? "Pause collection" : "Resume collection"}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-cream hover:text-ink"
                        onClick={() => toggleActive(collection)}
                      >
                        {collection.is_active ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button
                        type="button"
                        title="Delete collection"
                        aria-label={`Delete ${collection.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-danger/70 transition-colors hover:bg-[#fbeceb] hover:text-danger"
                        onClick={() => setPendingDelete(collection)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

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
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
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
                onChange={(event) =>
                  setForm({ ...form, target_payers: event.target.value })
                }
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

          <div className="rounded-xl border border-line bg-cream px-4 py-3">
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
