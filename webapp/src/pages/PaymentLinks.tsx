import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Link2, Plus, QrCode, Share2 } from "lucide-react";
import { useCollectionStats } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { copyText, formatMoney, formatNumber, paymentLink } from "@/lib/format";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  InlineNote,
  PageHeader,
  SearchInput,
  TableSkeleton,
  TONE_CARD,
} from "@/components/ui";

export default function PaymentLinks() {
  const collections = useCollectionStats({ status: "active" });
  const { success } = useToast();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const list = collections.data ?? [];
    if (!search.trim()) return list;
    const needle = search.trim().toLowerCase();
    return list.filter(
      (collection) =>
        collection.name.toLowerCase().includes(needle) ||
        collection.short_code.toLowerCase().includes(needle),
    );
  }, [collections.data, search]);

  const totals = useMemo(() => {
    const list = collections.data ?? [];
    return {
      links: list.length,
      collected: list.reduce((sum, c) => sum + (c.stats?.collected ?? 0), 0),
      payments: list.reduce((sum, c) => sum + (c.stats?.paid ?? 0), 0),
    };
  }, [collections.data]);

  const buildMessage = (name: string, amount: number, currency: string, code: string) =>
    `Pay for ${name} — ${formatMoney(amount, currency)}\n${paymentLink(code)}\n\nOpen the link, fill in your details and transfer to the account shown. Your receipt is emailed automatically.`;

  const summary = [
    { tone: "lavender" as const, label: "Active links", value: formatNumber(totals.links), hint: "Accepting payments now" },
    { tone: "mint" as const, label: "Collected", value: formatMoney(totals.collected), hint: "Through these links" },
    { tone: "peach" as const, label: "Payments", value: formatNumber(totals.payments), hint: "Successful, all links" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Collect"
        title="Payment links"
        description="One link per collection. Share it once in the group chat and every payer lands on the same form."
        actions={
          <Link to="/collections?new=1" className="btn btn-primary">
            <Plus size={15} /> New collection
          </Link>
        }
      />

      {/* summary: the same stacked pastel cards as the dashboard */}
      <div className="mb-6 lg:grid lg:grid-cols-3 lg:gap-4">
        {summary.map((item, index) => (
          <div
            key={item.label}
            className="dash-rise relative -mt-6 first:mt-0 lg:mt-0"
            style={{ zIndex: index + 1, animationDelay: `${index * 90}ms` }}
          >
            <div
              className={`flex min-h-[108px] items-center justify-between gap-3 rounded-[20px] border border-ink/15 px-5 py-5 shadow-sm lg:min-h-[92px] lg:flex-col lg:items-start lg:px-6 lg:py-5 ${TONE_CARD[item.tone]}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold tracking-tight lg:text-[18px]">{item.label}</p>
                <p className="mt-0.5 truncate text-[12.5px] opacity-70 lg:text-[13px]">{item.hint}</p>
              </div>
              <p className="shrink-0 text-right text-[20px] font-bold tabular lg:mt-2 lg:w-full lg:text-left lg:text-[28px]">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <InlineNote tone="info" title="No app for payers, ever">
        Links open in any browser — WhatsApp, Instagram or Chrome. Payers enter
        the details you asked for, transfer to the account shown, and receive a
        receipt by email.
      </InlineNote>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search active collections"
          className="w-full sm:w-[300px]"
        />
        <span className="ml-auto font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
          {rows.length} active link{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {collections.loading ? (
          <div className="lg:col-span-2 xl:col-span-3">
            <Card>
              <TableSkeleton rows={4} cols={3} />
            </Card>
          </div>
        ) : collections.error ? (
          <div className="lg:col-span-2 xl:col-span-3">
            <Card>
              <ErrorState message={collections.error} onRetry={collections.refetch} />
            </Card>
          </div>
        ) : rows.length === 0 ? (
          <div className="lg:col-span-2 xl:col-span-3">
            <Card>
              <EmptyState
                icon={<Link2 size={20} />}
                title={search ? "No links match that search" : "No active collection links"}
                description={
                  search
                    ? "Try another name or code, or clear the search."
                    : "Create a collection and its link is generated automatically. Paused collections are hidden here."
                }
                action={
                  <Link to="/collections?new=1" className="btn btn-primary btn-sm">
                    <Plus size={14} /> Create a collection
                  </Link>
                }
              />
            </Card>
          </div>
        ) : (
          rows.map((collection, index) => {
            const link = paymentLink(collection.short_code);
            const collected = collection.stats?.collected ?? 0;
            const paid = collection.stats?.paid ?? 0;
            return (
              <article
                key={collection.id}
                className="dash-rise flex h-full flex-col rounded-[18px] border border-ink/15 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
              >
                {/* title and state */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/collections/${collection.id}`}
                      className="block truncate text-[15.5px] font-semibold tracking-tight hover:text-brand-dark"
                    >
                      {collection.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-muted">
                      {collection.short_code}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-cream">
                    <span className="h-1.5 w-1.5 rounded-full bg-cream" />
                    Accepting
                  </span>
                </div>

                {/* figures: match groups collection card styling */}
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

                {/* the link itself - updated to match spacing */}
                <div className="mt-4 flex-1">
                  <div className="rounded-[14px] border border-dashed border-ink/25 bg-cream/20 px-3.5 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                      Payment link
                    </p>
                    <p className="mt-1 break-all font-mono text-[12px] text-ink-soft">
                      {link}
                    </p>
                  </div>
                </div>

                {/* payments count - positioned like groups collection card */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] text-ink-muted">
                    {paid} {paid === 1 ? "payment" : "payments"}
                  </p>
                </div>

                {/* actions: match groups layout */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-line-soft pt-4">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Link2 size={13} />}
                      onClick={async () => {
                        const ok = await copyText(link);
                        if (ok) success("Link copied", link);
                      }}
                    >
                      Copy link
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Share2 size={13} />}
                      onClick={async () => {
                        const ok = await copyText(
                          buildMessage(
                            collection.name,
                            collection.amount,
                            collection.currency,
                            collection.short_code,
                          ),
                        );
                        if (ok)
                          success(
                            "Message copied",
                            "Paste it into WhatsApp to share with payers.",
                          );
                      }}
                    >
                      Share
                    </Button>
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <ExternalLink size={13} /> Open
                    </a>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <Card className="mt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#9ff0f5] text-ink">
            <QrCode size={19} />
          </span>
          <div>
            <h2 className="section-title">Printing a poster or a flyer?</h2>
            <p className="muted mt-1.5">
              The payer page works on any device with a browser. Paste the link
              into your flyer or class group — there is nothing to install and no
              account for payers to create.
            </p>
            <p className="hint mt-2">
              Tip: use a short, clear message with the amount and the deadline.
              Collections that state the deadline get paid faster.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
