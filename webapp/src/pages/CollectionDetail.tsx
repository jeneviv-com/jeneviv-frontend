import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Copy,
  Download,
  ExternalLink,
  Eye,
  HandCoins,
  Pause,
  Play,
  Save,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import {
  collectionsAPI,
  transactionsAPI,
  type Collection,
  type CollectionField,
} from "@/lib/api";
import {
  useAction,
  useCollection,
  useCollectionFields,
  useCollectionTransactions,
} from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import {
  copyText,
  formatDate,
  formatMoney,
  formatNumber,
  paymentLink,
  percent,
  statusTone,
  timeAgo,
  transactionIdentifier,
  initials,
  transactionPayer,
} from "@/lib/format";
import { HeatStrip } from "@/components/charts";
import FieldEditor, { type DraftField } from "@/components/FieldEditor";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Pill,
  ProgressBar,
  SegmentedControl,
  Select,
  StatusPill,
  TableSkeleton,
  Tabs,
  Textarea,
  Toggle,
  TONE_CARD,
  type ToneCardTone,
} from "@/components/ui";

type Tab = "overview" | "fields" | "payments" | "settings";

/** One stacked pastel summary tile, the same look as the dashboard. */
function SummaryTile({
  index,
  tone,
  label,
  value,
  hint,
  icon,
}: {
  index: number;
  tone: ToneCardTone;
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div
      className="dash-rise relative -mt-6 first:mt-0"
      style={{ zIndex: index + 1, animationDelay: `${index * 80}ms` }}
    >
      <div
        className={`flex min-h-[108px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm lg:min-h-[92px] ${TONE_CARD[tone]}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight">{label}</p>
            <p className="mt-0.5 truncate text-[12px] opacity-70">{hint}</p>
          </div>
        </div>
        <p className="shrink-0 text-right text-[19px] font-bold tabular">{value}</p>
      </div>
    </div>
  );
}

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState<Tab>("overview");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "success" | "pending" | "failed">(
    "all",
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<DraftField[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const collection = useCollection(id);
  const fields = useCollectionFields(id);
  const transactions = useCollectionTransactions(
    id,
    paymentFilter === "all" ? undefined : paymentFilter,
  );

  const saveFields = useAction((collectionId: string, next: CollectionField[]) =>
    collectionsAPI.setFields(collectionId, next),
  );
  const updateCollection = useAction((collectionId: string, data: Partial<Collection>) =>
    collectionsAPI.update(collectionId, data),
  );
  const removeCollection = useAction((collectionId: string) =>
    collectionsAPI.delete(collectionId),
  );
  const reconcile = useAction((ids: string[]) => transactionsAPI.reconcile(ids, true));
  const exportRows = useAction((kind: "paid" | "unpaid") =>
    collectionsAPI.exportFile(id as string, kind),
  );

  const data = collection.data;
  const rows = transactions.data ?? [];
  const stats = data?.stats;

  const [settings, setSettings] = useState({
    name: "",
    description: "",
    amount: "",
    currency: "NGN",
    target_payers: "",
  });

  const hydratedId = data?.id;
  useEffect(() => {
    if (!data) return;
    setSettings({
      name: data.name,
      description: data.description ?? "",
      amount: String(data.amount),
      currency: data.currency,
      target_payers: String((data as { target_payers?: number }).target_payers ?? ""),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydratedId]);

  const dailyCounts = useMemo(() => {
    const days = 14;
    const values: number[] = [];
    const labels: string[] = [];
    for (let index = days - 1; index >= 0; index -= 1) {
      const day = new Date(Date.now() - index * 86_400_000);
      const key = day.toDateString();
      values.push(
        (transactions.data ?? []).filter(
          (transaction) =>
            transaction.status === "success" &&
            new Date(transaction.created_at).toDateString() === key,
        ).length,
      );
      labels.push(day.toLocaleDateString("en-NG", { day: "numeric" }));
    }
    return { values, labels };
  }, [transactions.data]);

  if (collection.error) {
    return (
      <div className="space-y-4">
        <Link
          to="/collections"
          className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} /> All collections
        </Link>
        <Card>
          <ErrorState message={collection.error} onRetry={collection.refetch} />
        </Card>
      </div>
    );
  }

  if (collection.loading || !data) {
    return (
      <div className="space-y-4">
        <Link
          to="/collections"
          className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} /> All collections
        </Link>
        <Card>
          <TableSkeleton rows={6} cols={4} />
        </Card>
      </div>
    );
  }

  const link = paymentLink(data.short_code);
  const target = (data as { target_payers?: number }).target_payers ?? 0;
  const paid = stats?.paid ?? 0;

  const shareMessage = `Pay for ${data.name} (${formatMoney(data.amount, data.currency)}): ${link}\n\nEnter your details, then transfer to the account shown. Your receipt is emailed automatically.`;

  const toggleActive = async () => {
    try {
      await updateCollection.run(data.id, { is_active: !data.is_active });
      await collection.refetch();
      success(
        data.is_active ? "Collection paused" : "Collection resumed",
        data.is_active
          ? "New payers will see that this collection is closed."
          : "The payment link is live again.",
      );
    } catch (err) {
      toastError("Could not update", err instanceof Error ? err.message : "");
    }
  };

  const saveSettings = async () => {
    try {
      await updateCollection.run(data.id, {
        name: settings.name,
        description: settings.description,
        amount: Number(settings.amount.replace(/[,\s]/g, "")),
        currency: settings.currency,
      } as Partial<Collection>);
      await collection.refetch();
      success("Collection updated", "Your changes are live on the payment page.");
    } catch (err) {
      toastError("Could not save changes", err instanceof Error ? err.message : "");
    }
  };

  const markReconciled = async () => {
    try {
      const result = await reconcile.run(selected);
      await transactions.refetch();
      setSelected([]);
      success(
        "Marked as reconciled",
        `${result.updated} payment${result.updated === 1 ? "" : "s"} updated.`,
      );
    } catch (err) {
      toastError("Could not reconcile", err instanceof Error ? err.message : "");
    }
  };

  const toggleRow = (transactionId: string, checked: boolean) =>
    setSelected((current) =>
      checked
        ? [...current, transactionId]
        : current.filter((value) => value !== transactionId),
    );

  const averagePayment = (stats?.collected ?? 0) / Math.max(1, paid);

  return (
    <>
      <Link
        to="/collections"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} /> All collections
      </Link>

      {/* title block */}
      <header className="dash-rise mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[24px] font-extrabold tracking-tight sm:text-[28px]">
              {data.name}
            </h1>
            <Pill tone={statusTone(data.is_active ? "active" : "paused")}>
              {data.is_active ? "Accepting payments" : "Paused"}
            </Pill>
          </div>
          <p className="muted mt-2 max-w-2xl">
            {data.description || "No description yet — add one so payers know what this covers."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
            <span>code · {data.short_code}</span>
            <span>created · {formatDate(data.created_at)}</span>
            <span>currency · {data.currency}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button
            variant="secondary"
            icon={<Copy size={14} />}
            onClick={async () => {
              const ok = await copyText(link);
              if (ok) success("Payment link copied", link);
            }}
          >
            Copy link
          </Button>
          <a href={link} target="_blank" rel="noreferrer" className="btn btn-secondary">
            <Eye size={14} /> Preview payer page
          </a>
          <Button
            variant={data.is_active ? "secondary" : "primary"}
            icon={data.is_active ? <Pause size={14} /> : <Play size={14} />}
            onClick={toggleActive}
            loading={updateCollection.loading}
          >
            {data.is_active ? "Pause" : "Resume"}
          </Button>
        </div>
      </header>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "fields", label: `Payer fields (${data.fields?.length ?? fields.data?.length ?? 0})` },
          { value: "payments", label: `Payments (${stats?.total ?? rows.length})` },
          { value: "settings", label: "Settings" },
        ]}
      />

      <div className="mt-5">
        {tab === "overview" ? (
          <div className="space-y-14">
            {/* summary tiles */}
            <div className="pt-1">
              <SummaryTile
                index={0}
                tone="mint"
                label="Collected"
                value={formatMoney(stats?.collected ?? 0, data.currency)}
                hint={`${formatNumber(paid)} successful payments`}
                icon={<HandCoins size={16} />}
              />
              <SummaryTile
                index={1}
                tone="lavender"
                label="Per payer"
                value={formatMoney(data.amount, data.currency)}
                hint={target ? `Target ${formatNumber(target)} payers` : "No target set"}
                icon={<Wallet size={16} />}
              />
              <SummaryTile
                index={2}
                tone="peach"
                label="Awaiting payment"
                value={formatNumber(target ? Math.max(0, target - paid) : stats?.pending ?? 0)}
                hint={target ? "Against your stated target" : `${stats?.pending ?? 0} transfers pending`}
                icon={<Users size={16} />}
              />
              <SummaryTile
                index={3}
                tone="aqua"
                label="Completion"
                value={`${target ? percent(paid, target) : Math.min(100, paid)}%`}
                hint={`${formatMoney(averagePayment, data.currency)} average payment`}
                icon={<BadgeCheck size={16} />}
              />
            </div>

            <div className="grid gap-14 xl:grid-cols-[1.5fr_1fr]">
              {/* activity */}
              <section>
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">Last 14 days</p>
                    <h2 className="mt-2 text-[22px] font-bold tracking-[-0.03em]">Payments by day</h2>
                  </div>
                  <span className="tabular font-mono text-[12px] text-ink-muted">
                    {paid} / {target || "—"}
                  </span>
                </div>
                <HeatStrip values={dailyCounts.values} labels={dailyCounts.labels} />
                <div className="mt-9 border-t border-line pt-7">
                  <div className="flex items-center justify-between">
                    <p className="text-[13.5px] font-semibold">Progress to target</p>
                    <p className="tabular font-mono text-[12px] text-ink-muted">
                      {target ? percent(paid, target) : Math.min(100, paid)}%
                    </p>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={target ? percent(paid, target) : Math.min(100, paid)} />
                  </div>
                </div>
              </section>

              {/* share: one dark block with the link and quick actions */}
              <section className="self-start rounded-[22px] bg-ink p-6 text-cream">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-cream/60">Share</p>
                <h2 className="mt-2 text-[21px] font-bold tracking-[-0.03em]">One link for every payer</h2>
                <div className="mt-5 break-all rounded-[14px] border border-cream/15 bg-cream/5 px-4 py-3.5 font-mono text-[12px] text-cream/85">
                  {link}
                </div>
                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyText(link);
                      if (ok) success("Link copied", link);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-white px-4 py-3 text-[13.5px] font-semibold text-ink transition-transform duration-150 active:scale-[0.98]"
                  >
                    <Copy size={14} /> Copy link
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyText(shareMessage);
                      if (ok) success("Message copied", "Paste it into WhatsApp — payers just tap the link.");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-cream/20 px-4 py-3 text-[13.5px] font-semibold text-cream transition-colors hover:bg-cream/10"
                  >
                    <Copy size={14} /> WhatsApp message
                  </button>
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-[13.5px] font-semibold text-cream/80 transition-colors hover:text-cream"
                  >
                    <ExternalLink size={14} /> Open payer page
                  </a>
                </div>
                <p className="mt-6 border-t border-cream/10 pt-5 text-[12.5px] leading-relaxed text-cream/60">
                  Payers see a form built from your payer fields, your amount, and a dedicated account to transfer to.
                  Payments are confirmed by webhook, not by narration.
                </p>
              </section>
            </div>
          </div>
        ) : null}

        {tab === "fields" ? (
          <section className="max-w-3xl">
            <div className="mb-8">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">Payer fields</p>
              <h2 className="mt-2 text-[24px] font-bold tracking-[-0.03em]">What payers answer</h2>
              <p className="muted mt-1.5">These questions appear on the payment page, in this order.</p>
            </div>

            {fields.loading && !data.fields ? (
              <TableSkeleton rows={3} cols={2} />
            ) : (
              <FieldEditor
                fields={data.fields ?? fields.data ?? []}
                onChange={setDrafts}
                saving={saveFields.loading}
                onSave={async (next) => {
                  try {
                    await saveFields.run(data.id, next);
                    await collection.refetch();
                    success("Fields saved", "The payment page now asks for these details.");
                  } catch (err) {
                    toastError("Could not save fields", err instanceof Error ? err.message : "");
                  }
                }}
                saveLabel="Save payer fields"
              />
            )}

            {drafts.length > 0 ? (
              <div className="mt-7 flex flex-wrap gap-2 text-[12px] font-semibold">
                <span className="rounded-full bg-ink px-3.5 py-1.5 text-cream">
                  {drafts.filter((field) => field.required).length} required
                </span>
                <span className="rounded-full bg-cream px-3.5 py-1.5 text-ink-soft">
                  {drafts.filter((field) => !field.required).length} optional
                </span>
              </div>
            ) : null}
          </section>
        ) : null}

        {tab === "payments" ? (
          <section>
            {/* header and filters */}
            <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">Payments</p>
                <h2 className="mt-2 text-[24px] font-bold tracking-[-0.03em]">
                  {formatNumber(rows.length)} in this view
                </h2>
              </div>
              <SegmentedControl
                value={paymentFilter}
                onChange={setPaymentFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "success", label: "Paid" },
                  { value: "pending", label: "Pending" },
                  { value: "failed", label: "Failed" },
                ]}
              />
            </div>

            {/* actions */}
            <div className="mb-8 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Download size={13} />}
                loading={exportRows.loading}
                onClick={async () => {
                  try {
                    await exportRows.run("paid");
                  } catch (err) {
                    toastError("Export failed", err instanceof Error ? err.message : "");
                  }
                }}
              >
                Paid Excel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Download size={13} />}
                loading={exportRows.loading}
                onClick={async () => {
                  try {
                    await exportRows.run("unpaid");
                  } catch (err) {
                    toastError("Export failed", err instanceof Error ? err.message : "");
                  }
                }}
              >
                Unpaid Excel
              </Button>
              <Button
                size="sm"
                icon={<BadgeCheck size={13} />}
                disabled={selected.length === 0}
                loading={reconcile.loading}
                onClick={markReconciled}
              >
                Mark reconciled {selected.length ? `(${selected.length})` : ""}
              </Button>
            </div>

            {transactions.loading ? (
              <TableSkeleton rows={6} cols={3} />
            ) : transactions.error ? (
              <ErrorState message={transactions.error} onRetry={transactions.refetch} />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<HandCoins size={20} />}
                title="No payments in this view"
                description="Payments appear here within seconds of the gateway confirming a transfer."
              />
            ) : (
              <>
                {/* phones: a calm list with initials, no boxes */}
                <ul className="divide-y divide-line md:hidden">
                  {rows.slice(0, 60).map((transaction) => {
                    const checked = selected.includes(transaction.id);
                    return (
                      <li key={transaction.id} className="flex items-center gap-3.5 py-4">
                        <input
                          type="checkbox"
                          aria-label={`Select ${transaction.reference}`}
                          checked={checked}
                          onChange={(event) => toggleRow(transaction.id, event.target.checked)}
                          className="h-4 w-4 shrink-0 rounded border-line"
                        />
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">
                          {initials(transactionPayer(transaction))}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="truncate text-[14px] font-semibold">{transactionPayer(transaction)}</p>
                            <p className="tabular shrink-0 text-[14px] font-bold">
                              {formatMoney(transaction.amount, transaction.currency)}
                            </p>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px] text-ink-muted">
                            <StatusPill status={transaction.status} />
                            <span>
                              {transaction.reconciled ? "Reconciled" : "Not reconciled"} · {timeAgo(transaction.created_at)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* tablets and up: the full table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="w-10">
                          <input
                            type="checkbox"
                            aria-label="Select all"
                            checked={selected.length === rows.length && rows.length > 0}
                            onChange={(event) =>
                              setSelected(event.target.checked ? rows.map((r) => r.id) : [])
                            }
                            className="h-4 w-4 rounded border-line"
                          />
                        </th>
                        <th>Payer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Reconciled</th>
                        <th>Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 60).map((transaction) => (
                        <tr key={transaction.id}>
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Select ${transaction.reference}`}
                              checked={selected.includes(transaction.id)}
                              onChange={(event) => toggleRow(transaction.id, event.target.checked)}
                              className="h-4 w-4 rounded border-line"
                            />
                          </td>
                          <td>
                            <p className="font-semibold">{transactionPayer(transaction)}</p>
                            <p className="font-mono text-3xs text-ink-muted">
                              {transactionIdentifier(transaction)}
                            </p>
                          </td>
                          <td className="tabular font-semibold">
                            {formatMoney(transaction.amount, transaction.currency)}
                          </td>
                          <td>
                            <StatusPill status={transaction.status} />
                          </td>
                          <td>
                            {transaction.reconciled ? (
                              <Pill tone="green">Yes</Pill>
                            ) : (
                              <Pill tone="neutral">No</Pill>
                            )}
                          </td>
                          <td className="text-ink-muted">{timeAgo(transaction.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        ) : null}

        {tab === "settings" ? (
          <div className="grid gap-12 xl:grid-cols-[1.4fr_1fr]">
            {/* edit */}
            <section>
              <div className="mb-7">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">Edit collection</p>
                <h2 className="mt-2 text-[24px] font-bold tracking-[-0.03em]">Collection details</h2>
                <p className="muted mt-1.5">Changes go live on the payment page straight away.</p>
              </div>

              <div className="space-y-5">
                <Field label="Name" htmlFor="edit-name">
                  <Input
                    id="edit-name"
                    className="h-[50px] rounded-[12px]"
                    value={settings.name}
                    onChange={(event) => setSettings({ ...settings, name: event.target.value })}
                  />
                </Field>
                <Field label="Description" htmlFor="edit-description">
                  <Textarea
                    id="edit-description"
                    className="rounded-[12px]"
                    value={settings.description}
                    onChange={(event) => setSettings({ ...settings, description: event.target.value })}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Amount per payer" htmlFor="edit-amount">
                    <Input
                      id="edit-amount"
                      className="h-[50px] rounded-[12px]"
                      value={settings.amount}
                      onChange={(event) => setSettings({ ...settings, amount: event.target.value })}
                    />
                  </Field>
                  <Field label="Currency" htmlFor="edit-currency">
                    <Select
                      id="edit-currency"
                      className="h-[50px] rounded-[12px]"
                      value={settings.currency}
                      onChange={(event) => setSettings({ ...settings, currency: event.target.value })}
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                    </Select>
                  </Field>
                  <Field label="Expected payers" htmlFor="edit-target">
                    <Input
                      id="edit-target"
                      className="h-[50px] rounded-[12px]"
                      value={settings.target_payers}
                      onChange={(event) => setSettings({ ...settings, target_payers: event.target.value })}
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-[16px] bg-cream px-5 py-4">
                  <Toggle
                    checked={data.is_active}
                    onChange={toggleActive}
                    label="Accepting payments"
                    description="Pausing keeps the data but stops new payers from paying."
                  />
                </div>

                <div className="pt-2">
                  <Button
                    size="lg"
                    className="h-[50px] rounded-[12px] px-7"
                    icon={<Save size={14} />}
                    loading={updateCollection.loading}
                    onClick={saveSettings}
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </section>

            {/* danger zone */}
            <aside className="self-start rounded-[20px] bg-[#ffd6cf] p-6">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">Danger zone</p>
              <h3 className="mt-2 text-[18px] font-bold tracking-tight">Delete this collection</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
                Payments already recorded are removed with it. If you only want to stop new payments, pause it instead.
                Deleting cannot be undone from the dashboard, so export your payer list first.
              </p>
              <Button
                variant="danger"
                className="mt-5 rounded-[12px]"
                icon={<Trash2 size={14} />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete collection
              </Button>
            </aside>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${data.name}?`}
        description="Payers will no longer be able to pay into this link."
        confirmLabel="Delete collection"
        destructive
        loading={removeCollection.loading}
        onConfirm={async () => {
          try {
            await removeCollection.run(data.id);
            success("Collection deleted", `${data.name} was removed.`);
            navigate("/collections");
          } catch (err) {
            toastError("Could not delete", err instanceof Error ? err.message : "");
          }
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
