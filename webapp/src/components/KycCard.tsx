import { useEffect, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Banknote,
  Fingerprint,
  Image as ImageIcon,
  Loader2,
  Users,
} from "lucide-react";
import { APIError, merchantsAPI } from "@/lib/api";
import LogoPicker from "@/components/LogoPicker";
import { useAction, useBankAccounts, useBanks, useKyc } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDateTime } from "@/lib/format";
import {
  Button,
  Field,
  InlineNote,
  Input,
  Select,
  TONE_MEANING,
  type ToneKind,
} from "@/components/ui";

function messageOf(error: unknown): string {
  if (error instanceof APIError) {
    const details = (error.data as { error?: { details?: unknown } })?.error?.details;
    if (details && typeof details === "object") {
      const record = details as Record<string, unknown>;
      if (typeof record.account_name === "string" && typeof record.legal_name === "string") {
        return `Bank name "${record.account_name}" does not match the NIN name "${record.legal_name}".`;
      }
    }
    return error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

/** Status chip with a round icon well, shared look with Settings. */
function Chip({
  tone,
  icon,
  children,
}: {
  tone: ToneKind;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[12px] font-semibold ${TONE_MEANING[tone]}`}
    >
      {icon ? (
        <span className="grid h-5 w-5 place-items-center rounded-full bg-white/85 text-ink">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

/** One numbered step in the verification flow. Steps are a line, not boxes. */
function Step({
  number,
  done,
  title,
  body,
  children,
}: {
  number: number;
  done: boolean;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-9 last:pb-0">
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[15px] top-9 w-px bg-line last:hidden"
      />
      <span
        className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold ${
          done ? "bg-ink text-cream" : "border border-ink bg-white text-ink"
        }`}
      >
        {done ? <BadgeCheck size={15} /> : number}
      </span>
      <div className="min-w-0 flex-1 space-y-4 pt-0.5">
        <div>
          <p className="text-[15px] font-bold tracking-tight">{title}</p>
          <p className="muted mt-1">{body}</p>
        </div>
        {children}
      </div>
    </li>
  );
}

export default function KycCard() {
  const kyc = useKyc();
  const banks = useBanks("NG");
  const accounts = useBankAccounts();
  const { refreshMerchant } = useAuth();
  const { success, error: toastError } = useToast();

  const [nin, setNin] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [treasurer, setTreasurer] = useState({ name: "", phone: "" });
  const [logoUrl, setLogoUrl] = useState("");

  const data = kyc.data;

  useEffect(() => {
    if (!data) return;
    setTreasurer({
      name: data.treasurer_name ?? "",
      phone: data.treasurer_phone ?? "",
    });
    setLogoUrl(data.logo_url ?? "");
  }, [data?.treasurer_name, data?.treasurer_phone, data?.logo_url]);

  const verifyNin = useAction((value: string) => merchantsAPI.verifyNin(value));
  const verifyBank = useAction((code: string, account: string) =>
    merchantsAPI.verifyBank(code, account),
  );
  const saveTreasurer = useAction((name: string, phone: string) =>
    merchantsAPI.setTreasurer(name, phone),
  );
  const saveLogo = useAction((value: string) =>
    merchantsAPI.updateSettings({ logo_url: value || null }),
  );

  const refresh = async () => {
    await kyc.refetch();
    await accounts.refetch();
    await refreshMerchant();
  };

  const run = async (task: () => Promise<unknown>, okTitle: string, okBody: string) => {
    try {
      await task();
      await refresh();
      success(okTitle, okBody);
    } catch (error) {
      toastError("Could not verify", messageOf(error));
    }
  };

  const busy = verifyNin.loading || verifyBank.loading;
  const ninDone = Boolean(data?.verified_legal_name);
  const bankDone = Boolean(data?.can_withdraw);
  const treasurerDone = Boolean(data?.treasurer_name && data?.treasurer_phone);

  const maturity =
    data?.maturity === "ready"
      ? { tone: "money" as const, label: "Ready for direct settlement" }
      : data?.maturity === "nin_verified"
        ? { tone: "attention" as const, label: "NIN verified · bank pending" }
        : { tone: "attention" as const, label: "Verification pending" };

  if (kyc.loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-[13px] text-ink-muted">
        <Loader2 size={16} className="animate-spin" /> Loading verification…
      </div>
    );
  }

  if (kyc.error) {
    return <InlineNote tone="error">{kyc.error}</InlineNote>;
  }

  return (
    <div className="space-y-8">
      {/* status row */}
      <div className="flex flex-wrap items-center gap-2">
        <Chip
          tone={data?.can_collect ? "money" : "neutral"}
          icon={<span className="h-1.5 w-1.5 rounded-full bg-ink" />}
        >
          {data?.can_collect ? "Collect on" : "Collect off"}
        </Chip>
        <Chip
          tone={data?.can_withdraw ? "money" : "attention"}
          icon={<span className="h-1.5 w-1.5 rounded-full bg-ink" />}
        >
          {data?.can_withdraw ? "Settlement ready" : "Settlement locked"}
        </Chip>
        <Chip tone={maturity.tone}>{maturity.label}</Chip>
        {busy ? (
          <span className="flex items-center gap-1.5 text-[12px] text-ink-muted">
            <Loader2 size={12} className="animate-spin" /> checking…
          </span>
        ) : null}
      </div>

      <p className="muted -mt-4 max-w-2xl">
        Collect from day one. Payments settle once the NIN and bank account names match.
      </p>

      {/* the three steps */}
      <ol className="relative">
        <Step
          number={1}
          done={ninDone}
          title="Verify your NIN"
          body="Checked with Dojah against the NIMC record."
        >
          {ninDone ? (
            <InlineNote tone="success" title="NIN verified">
              {data?.verified_legal_name}
              {data?.nin_last4 ? ` ·••• ${data.nin_last4}` : ""}
              {data?.nin_verified_at ? ` · ${formatDateTime(data.nin_verified_at)}` : ""}
            </InlineNote>
          ) : (
            <>
              <Field
                label="National Identity Number"
                htmlFor="kyc-nin"
                hint="11 digits. Stored as a hash, never in plain text."
              >
                <Input
                  id="kyc-nin"
                  inputMode="numeric"
                  maxLength={11}
                  value={nin}
                  onChange={(event) => setNin(event.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="70123456789"
                  className="font-mono"
                />
              </Field>
              <Button
                icon={<Fingerprint size={14} />}
                loading={verifyNin.loading}
                disabled={nin.length !== 11}
                onClick={() =>
                  run(
                    () => verifyNin.run(nin),
                    "NIN verified",
                    "Now link the settlement bank account.",
                  )
                }
              >
                Verify NIN
              </Button>
            </>
          )}
        </Step>

        <Step
          number={2}
          done={bankDone}
          title="Link the settlement bank"
          body="Resolved with Paystack. The account name must match the NIN name."
        >
          {bankDone ? (
            <InlineNote tone="success" title="Bank verified">
              Paystack now settles collections straight into this account.
            </InlineNote>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Bank" htmlFor="kyc-bank">
                  <Select
                    id="kyc-bank"
                    value={bankCode}
                    onChange={(event) => setBankCode(event.target.value)}
                  >
                    <option value="">Select bank</option>
                    {(banks.data ?? []).map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Account number" htmlFor="kyc-account">
                  <Input
                    id="kyc-account"
                    inputMode="numeric"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(event) =>
                      setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="0123456789"
                    className="font-mono"
                  />
                </Field>
              </div>
              <Button
                icon={<Banknote size={14} />}
                loading={verifyBank.loading}
                disabled={!ninDone || !bankCode || accountNumber.length !== 10}
                onClick={() =>
                  run(
                    () => verifyBank.run(bankCode, accountNumber),
                    "Bank verified",
                    "Payments will settle straight into this account.",
                  )
                }
              >
                Verify account name
              </Button>
              {!ninDone ? (
                <p className="hint">Verify the NIN first — the names must match.</p>
              ) : null}
            </>
          )}
        </Step>

        {data?.escrow_enabled ? (
        <Step
          number={3}
          done={treasurerDone}
          title="Add the treasurer"
          body="Every sweep needs their OTP. The rep alone can never move money."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Treasurer name" htmlFor="treasurer-name">
              <Input
                id="treasurer-name"
                value={treasurer.name}
                onChange={(event) => setTreasurer({ ...treasurer, name: event.target.value })}
                placeholder="Mrs Adeyemi"
              />
            </Field>
            <Field label="Phone number" htmlFor="treasurer-phone" hint="OTP is sent here by SMS.">
              <Input
                id="treasurer-phone"
                inputMode="tel"
                value={treasurer.phone}
                onChange={(event) => setTreasurer({ ...treasurer, phone: event.target.value })}
                placeholder="08012345678"
                className="font-mono"
              />
            </Field>
          </div>
          <Button
            variant="secondary"
            icon={<Users size={14} />}
            loading={saveTreasurer.loading}
            disabled={treasurer.name.trim().length < 2 || treasurer.phone.trim().length < 10}
            onClick={() =>
              run(
                () => saveTreasurer.run(treasurer.name.trim(), treasurer.phone.trim()),
                "Treasurer saved",
                "Sweeps will now wait for their approval.",
              )
            }
          >
            Save treasurer
          </Button>
        </Step>
        ) : null}
      </ol>

      {/* logo: a quiet add-on, not a step. Picked from the device and saved on upload. */}
      <div className="border-t border-line pt-7">
        <div className="mb-3 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-cream text-ink-soft">
            <ImageIcon size={16} />
          </span>
          <div>
            <p className="text-[14px] font-bold tracking-tight">School logo</p>
            <p className="muted mt-0.5">Appears on the PDF receipt and the public verification page.</p>
          </div>
        </div>
        <LogoPicker
          value={logoUrl || null}
          onChange={(url) => {
            setLogoUrl(url ?? "");
            run(
              () => saveLogo.run(url ?? ""),
              url ? "Logo saved" : "Logo removed",
              url ? "New receipts will use it." : "Receipts will show the default mark.",
            );
          }}
        />
      </div>
    </div>
  );
}