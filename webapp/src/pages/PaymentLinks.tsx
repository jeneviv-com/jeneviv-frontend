import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Link2, Plus, QrCode, Share2 } from "lucide-react";
import { useCollectionStats } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { copyText, formatMoney, paymentLink } from "@/lib/format";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  InlineNote,
  PageHeader,
  Pill,
  SearchInput,
  TableSkeleton,
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

  const buildMessage = (name: string, amount: number, currency: string, code: string) =>
    `Pay for ${name} — ${formatMoney(amount, currency)}\n${paymentLink(code)}\n\nOpen the link, fill in your details and transfer to the account shown. Your receipt is emailed automatically.`;

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
        <span className="font-mono text-3xs uppercase tracking-[0.12em] text-ink-muted">
          {rows.length} active link{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {collections.loading ? (
          <Card padded={false}>
            <TableSkeleton rows={4} cols={3} />
          </Card>
        ) : collections.error ? (
          <Card>
            <ErrorState message={collections.error} onRetry={collections.refetch} />
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Link2 size={20} />}
              title={
                search
                  ? "No links match that search"
                  : "No active collection links"
              }
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
        ) : (
          rows.map((collection) => {
            const link = paymentLink(collection.short_code);
            const collected = collection.stats?.collected ?? 0;
            const paid = collection.stats?.paid ?? 0;
            return (
              <Card key={collection.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        to={`/collections/${collection.id}`}
                        className="text-[15px] font-bold tracking-tight hover:text-brand"
                      >
                        {collection.name}
                      </Link>
                      <Pill tone="brand">{collection.short_code}</Pill>
                      <Pill tone="green">Accepting</Pill>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-ink-muted">
                      <span className="tabular">
                        {formatMoney(collection.amount, collection.currency)} per payer
                      </span>
                      <span className="tabular">
                        {formatMoney(collected, collection.currency)} collected
                      </span>
                      <span>{paid} payments</span>
                    </div>
                    <div className="mt-3 rounded-xl border border-dashed border-line bg-cream px-3.5 py-2.5 font-mono text-[12px] text-ink-soft">
                      <span className="break-all">{link}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
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
                    <Button
                      variant="secondary"
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
                      Copy message
                    </Button>
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      <ExternalLink size={13} /> Open page
                    </a>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Card className="mt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
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
