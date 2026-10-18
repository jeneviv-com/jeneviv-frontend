import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Copy,
  ExternalLink,
  Eye,
  HandCoins,
  Link2,
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
  transactionPayer,
} from "@/lib/format";
import { HeatStrip } from "@/components/charts";
import FieldEditor, { type DraftField } from "@/components/FieldEditor";
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  InlineNote,
  Input,
  Pill,
  ProgressBar,
  SegmentedControl,
  Select,
  StatCard,
  StatusPill,
  TableSkeleton,
  Tabs,
  Textarea,
  Toggle,
} from "@/components/ui";

type Tab = "overview" | "fields" | "payments" | "settings";

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
      labels.push(
        day.toLocaleDateString("en-NG", { day: "numeric" }),
      );
    }
    return { values, labels };
  }, [transactions.data]);

  if (collection.error) {
    return (
      <Card>
        <ErrorState message={collection.error} onRetry={collection.refetch} />
      </Card>
    );
  }

  if (collection.loading || !data) {
    return (
      <Card padded={false}>
        <TableSkeleton rows={6} cols={4} />
      </Card>
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

  return (
    <>
      <Link
        to="/collections"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} /> All collections
      </Link>

      <header className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
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

        <div className="flex flex-wrap items-center gap-2">
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
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Collected"
                value={formatMoney(stats?.collected ?? 0, data.currency)}
                hint={`${paid} successful payments`}
                tone="brand"
                icon={<HandCoins size={16} />}
              />
              <StatCard
                label="Per payer"
                value={formatMoney(data.amount, data.currency)}
                hint={target ? `Target ${formatNumber(target)} payers` : "No target set"}
                icon={<Wallet size={16} />}
              />
              <StatCard
                label="Awaiting payment"
                value={formatNumber(
                  target ? Math.max(0, target - paid) : stats?.pending ?? 0,
                )}
                hint={target ? "Against your stated target" : `${stats?.pending ?? 0} transfers pending`}
                icon={<Users size={16} />}
              />
              <StatCard
                label="Completion"
                value={`${target ? percent(paid, target) : Math.min(100, paid)}%`}
                hint={`${formatMoney((stats?.collected ?? 0) / Math.max(1, paid), data.currency)} average payment`}
                tone="green"
                icon={<BadgeCheck size={16} />}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
              <Card>
                <CardHeader
                  title="Payments in the last 14 days"
                  subtitle="Darker squares mean more successful payments that day"
                />
                <HeatStrip values={dailyCounts.values} labels={dailyCounts.labels} />
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold">Progress to target</p>
                    <p className="tabular font-mono text-3xs text-ink-muted">
                      {paid} / {target || "—"}
                    </p>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={target ? percent(paid, target) : Math.min(100, paid)} />
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Share this collection"
                  subtitle="One link works for every payer"
                  icon={<Link2 size={16} />}
                />
                <div className="rounded-xl border border-dashed border-line bg-cream px-3.5 py-3 font-mono text-[12px] text-ink-soft">
                  <span className="break-all">{link}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Copy size={13} />}
                    onClick={async () => {
                      const ok = await copyText(link);
                      if (ok) success("Link copied", link);
                    }}
                  >
                    Copy link
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Copy size={13} />}
                    onClick={async () => {
                      const ok = await copyText(shareMessage);
                      if (ok)
                        success(
                          "Message copied",
                          "Paste it into WhatsApp — payers just tap the link.",
                        );
                    }}
                  >
                    Copy WhatsApp message
                  </Button>
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    <ExternalLink size={13} /> Open
                  </a>
                </div>
                <InlineNote tone="info" title="What payers see">
                  A form built from your payer fields, your amount, and a
                  dedicated account number to transfer to. Payments are confirmed
                  by webhook — not by narration.
                </InlineNote>
              </Card>
            </div>
          </div>
        ) : null}

        {tab === "fields" ? (
          <Card>
            <CardHeader
              title="Payer fields"
              subtitle="What you ask for on the payment page"
              icon={<Users size={16} />}
            />
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
                    toastError(
                      "Could not save fields",
                      err instanceof Error ? err.message : "",
                    );
                  }
                }}
                saveLabel="Save payer fields"
              />
            )}
            {drafts.length > 0 ? (
              <p className="hint mt-3">
                {drafts.filter((field) => field.required).length} required ·{" "}
                {drafts.filter((field) => !field.required).length} optional
              </p>
            ) : null}
          </Card>
        ) : null}

        {tab === "payments" ? (
          <Card padded={false}>
            <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3">
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
              <span className="ml-auto flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={selected.length === 0}
                  loading={reconcile.loading}
                  onClick={markReconciled}
                >
                  Mark reconciled {selected.length ? `(${selected.length})` : ""}
                </Button>
                <span className="font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
                  {rows.length} rows
                </span>
              </span>
            </div>

            {transactions.loading ? (
              <TableSkeleton rows={6} cols={5} />
            ) : transactions.error ? (
              <ErrorState message={transactions.error} onRetry={transactions.refetch} />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<HandCoins size={20} />}
                title="No payments in this view"
                description="Payments appear here within seconds of the gateway confirming a transfer."
              />
            ) : (
              <div className="overflow-x-auto">
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
                            onChange={(event) =>
                              setSelected((current) =>
                                event.target.checked
                                  ? [...current, transaction.id]
                                  : current.filter((value) => value !== transaction.id),
                              )
                            }
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
                        <td className="text-ink-muted">
                          {timeAgo(transaction.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ) : null}

        {tab === "settings" ? (
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader title="Collection details" subtitle="Changes are live immediately" />
              <div className="space-y-4">
                <Field label="Name" htmlFor="edit-name">
                  <Input
                    id="edit-name"
                    value={settings.name}
                    onChange={(event) =>
                      setSettings({ ...settings, name: event.target.value })
                    }
                  />
                </Field>
                <Field label="Description" htmlFor="edit-description">
                  <Textarea
                    id="edit-description"
                    value={settings.description}
                    onChange={(event) =>
                      setSettings({ ...settings, description: event.target.value })
                    }
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Amount per payer" htmlFor="edit-amount">
                    <Input
                      id="edit-amount"
                      value={settings.amount}
                      onChange={(event) =>
                        setSettings({ ...settings, amount: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Currency" htmlFor="edit-currency">
                    <Select
                      id="edit-currency"
                      value={settings.currency}
                      onChange={(event) =>
                        setSettings({ ...settings, currency: event.target.value })
                      }
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                    </Select>
                  </Field>
                  <Field label="Expected payers" htmlFor="edit-target">
                    <Input
                      id="edit-target"
                      value={settings.target_payers}
                      onChange={(event) =>
                        setSettings({ ...settings, target_payers: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className="rounded-xl border border-line bg-cream px-4 py-3">
                  <Toggle
                    checked={data.is_active}
                    onChange={toggleActive}
                    label="Accepting payments"
                    description="Pausing keeps the data but stops new payers from paying."
                  />
                </div>
                <Button
                  icon={<Save size={14} />}
                  loading={updateCollection.loading}
                  onClick={saveSettings}
                >
                  Save changes
                </Button>
              </div>
            </Card>

            <Card className="border-[#f4cecb]">
              <CardHeader
                title="Delete this collection"
                subtitle="Payments already recorded are removed with it"
              />
              <p className="muted">
                If you only want to stop new payments, pause it instead. Deleting
                cannot be undone from the dashboard — export your payer list
                first.
              </p>
              <Button
                variant="danger"
                className="mt-4"
                icon={<Trash2 size={14} />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete collection
              </Button>
            </Card>
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
