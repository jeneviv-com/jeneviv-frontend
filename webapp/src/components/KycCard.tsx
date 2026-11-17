import LogoPicker from "@/components/LogoPicker";
import {
  Button,
  Field,
  InlineNote,
  Input,
  SegmentedControl,
  Select,
  TONE_MEANING,
  type ToneKind,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useAction, useBankAccounts, useBanks, useKyc } from "@/hooks/useApi";
import { APIError, merchantsAPI } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import {
  BadgeCheck,
  Banknote,
  Fingerprint,
  Image as ImageIcon,
  Loader2,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

function messageOf(error: unknown): string {
  if (error instanceof APIError) {
    const details = (error.data as { error?: { details?: unknown } })?.error
      ?.details;
    if (details && typeof details === "object") {
      const record = details as Record<string, unknown>;
      if (
        typeof record.account_name === "string" &&
        typeof record.legal_name === "string"
      ) {
        const idLabel = record.id_type === "bvn" ? "BVN" : "NIN";
        return `Bank name "${record.account_name}" does not match the ${idLabel} name "${record.legal_name}".`;
      }
    }
    return error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

type IdType = "nin" | "bvn";

/** Copy for each identity method, so the form below stays one code path. */
const ID_METHODS: Record<
  IdType,
  {
    short: string;
    long: string;
    placeholder: string;
    body: string;
    hint: string;
  }
> = {
  nin: {
    short: "NIN",
    long: "National Identity Number",
    placeholder: "70123456789",
    body: "Verified through Veripine against your NIMC record.",
    hint: "11 digits. Dial *346# on your registered line to retrieve it. Stored as a hash, never in plain text.",
  },
  bvn: {
    short: "BVN",
    long: "Bank Verification Number",
    placeholder: "22123456789",
    body: "Verified through Veripine against your bank's BVN record.",
    hint: "11 digits. Dial *565*0# on your bank-registered line to retrieve it. Stored as a hash, never in plain text.",
  },
};

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
  const gateway = useGateway();
  const kyc = useKyc();
  const banks = useBanks("NG");
  const accounts = useBankAccounts();
  const { refreshMerchant } = useAuth();
  const { success, error: toastError } = useToast();

  const [idType, setIdType] = useState<IdType>("nin");
  const [idNumber, setIdNumber] = useState("");
  const [idConsent, setIdConsent] = useState(false);
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

  const verifyId = useAction((type: IdType, value: string) =>
    type === "bvn"
      ? merchantsAPI.verifyBvn(value)
      : merchantsAPI.verifyNin(value),
  );
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

  const run = async (
    task: () => Promise<unknown>,
    okTitle: string,
    okBody: string,
  ) => {
    try {
      await task();
      await refresh();
      success(okTitle, okBody);
    } catch (error) {
      toastError("Could not verify", messageOf(error));
    }
  };

  const busy = verifyId.loading || verifyBank.loading;
  const ninDone = Boolean(data?.verified_legal_name);
  const method = ID_METHODS[idType];
  // Older API builds don't send id_type; everything verified then was a NIN.
  const verifiedType: IdType = data?.id_type === "bvn" ? "bvn" : "nin";
  const verifiedLabel = ID_METHODS[verifiedType].short;
  const verifiedLast4 = data?.id_last4 ?? data?.nin_last4 ?? null;
  const bankDone = Boolean(data?.can_withdraw);
  const treasurerDone = Boolean(data?.treasurer_name && data?.treasurer_phone);

  const maturity =
    data?.maturity === "ready"
      ? { tone: "money" as const, label: "Ready for direct settlement" }
      : data?.maturity === "nin_verified"
        ? {
            tone: "attention" as const,
            label: `${verifiedLabel} verified · bank pending`,
          }
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
        Collect from day one. Payments settle once the NIN or BVN name matches
        the bank account name.
      </p>

      {/* the three steps */}
      <ol className="relative">
        <Step
          number={1}
          done={ninDone}
          title={
            ninDone
              ? `Identity verified with ${verifiedLabel}`
              : "Verify your identity"
          }
          body={
            ninDone
              ? ID_METHODS[verifiedType].body
              : "Use your NIN or your BVN. Either one unlocks settlement once the bank name matches."
          }
        >
          {ninDone ? (
            <InlineNote tone="success" title={`${verifiedLabel} verified`}>
              {data?.verified_legal_name}
              {verifiedLast4 ? ` ·••• ${verifiedLast4}` : ""}
              {data?.nin_verified_at
                ? ` · ${formatDateTime(data.nin_verified_at)}`
                : ""}
            </InlineNote>
          ) : (
            <>
              <SegmentedControl<IdType>
                value={idType}
                onChange={(next) => {
                  if (next === idType) return;
                  setIdType(next);
                  setIdNumber("");
                  setIdConsent(false);
                }}
                options={[
                  { value: "nin", label: "NIN" },
                  { value: "bvn", label: "BVN" },
                ]}
              />
              <Field
                label={method.long}
                htmlFor="kyc-id-number"
                hint={method.hint}
              >
                <Input
                  id="kyc-id-number"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={11}
                  value={idNumber}
                  onChange={(event) => {
                    setIdNumber(
                      event.target.value.replace(/\D/g, "").slice(0, 11),
                    );
                    setIdConsent(false);
                  }}
                  placeholder={method.placeholder}
                  className="font-mono"
                />
              </Field>
              <label className="flex items-start gap-2 text-[13px] text-ink-muted">
                <input
                  type="checkbox"
                  checked={idConsent}
                  onChange={(event) => setIdConsent(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I confirm I have the data subject&apos;s consent to verify
                  this {method.short} with Veripine.
                </span>
              </label>
              <Button
                icon={<Fingerprint size={14} />}
                loading={verifyId.loading}
                disabled={idNumber.length !== 11 || !idConsent}
                onClick={() =>
                  run(
                    () => verifyId.run(idType, idNumber),
                    `${method.short} verified`,
                    "Now link the settlement bank account.",
                  )
                }
              >
                Verify {method.short}
              </Button>
            </>
          )}
        </Step>

        <Step
          number={2}
          done={bankDone}
          title="Link the settlement bank"
          body={`Resolved with Paystack. The account name must match the ${
            ninDone ? verifiedLabel : "NIN or BVN"
          } name.`}
        >
          {bankDone ? (
            <InlineNote tone="success" title="Bank verified">
              {gateway.settles_direct
                ? `${gateway.label} now settles collections straight into this account.`
                : "Payouts from your Jeneviv wallet now go to this account."}
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
                      setAccountNumber(
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      )
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
                <p className="hint">
                  Verify your NIN or BVN first. The names must match.
                </p>
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
                  onChange={(event) =>
                    setTreasurer({ ...treasurer, name: event.target.value })
                  }
                  placeholder="Mrs Adeyemi"
                />
              </Field>
              <Field
                label="Phone number"
                htmlFor="treasurer-phone"
                hint="OTP is sent here by SMS."
              >
                <Input
                  id="treasurer-phone"
                  inputMode="tel"
                  value={treasurer.phone}
                  onChange={(event) =>
                    setTreasurer({ ...treasurer, phone: event.target.value })
                  }
                  placeholder="08012345678"
                  className="font-mono"
                />
              </Field>
            </div>
            <Button
              variant="secondary"
              icon={<Users size={14} />}
              loading={saveTreasurer.loading}
              disabled={
                treasurer.name.trim().length < 2 ||
                treasurer.phone.trim().length < 10
              }
              onClick={() =>
                run(
                  () =>
                    saveTreasurer.run(
                      treasurer.name.trim(),
                      treasurer.phone.trim(),
                    ),
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
            <p className="text-[14px] font-bold tracking-tight">
              Organization logo
            </p>
            <p className="muted mt-0.5">
              Appears on the PDF receipt and the public verification page.
            </p>
          </div>
        </div>
        <LogoPicker
          value={logoUrl || null}
          onChange={(url) => {
            setLogoUrl(url ?? "");
            run(
              () => saveLogo.run(url ?? ""),
              url ? "Logo saved" : "Logo removed",
              url
                ? "New receipts will use it."
                : "Receipts will show the default mark.",
            );
          }}
        />
      </div>
    </div>
  );
}
