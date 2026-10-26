import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Banknote,
  Building2,
  Fingerprint,
  Image as ImageIcon,
  Loader2,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";
import { APIError, merchantsAPI } from "@/lib/api";
import { useAction, useBankAccounts, useBanks, useKyc } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDateTime } from "@/lib/format";
import {
  Button,
  Card,
  CardHeader,
  Field,
  InlineNote,
  Input,
  Pill,
  Select,
} from "@/components/ui";

function messageOf(error: unknown): string {
  if (error instanceof APIError) {
    const details = (error.data as { error?: { details?: unknown } })?.error
      ?.details;
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

  const busy = verifyNin.loading || verifyBank.loading;

  return (
    <Card padded={false}>
      <div className="px-5 pt-5">
        <CardHeader
          title="Identity & bank verification"
          subtitle="Collect from day one. Payments settle once the NIN and bank account names match."
          icon={<ShieldCheck size={16} />}
          action={
            <div className="flex flex-wrap gap-2">
              <Pill tone={data?.can_collect ? "green" : "neutral"}>
                {data?.can_collect ? "Collect on" : "Collect off"}
              </Pill>
              <Pill tone={data?.can_withdraw ? "green" : "amber"}>
                {data?.can_withdraw ? "Settlement ready" : "Settlement locked"}
              </Pill>
            </div>
          }
        />
      </div>

      {kyc.loading ? (
        <div className="flex items-center gap-2 px-5 py-8 text-[13px] text-ink-muted">
          <Loader2 size={16} className="animate-spin" /> Loading verification…
        </div>
      ) : kyc.error ? (
        <div className="px-5 py-6">
          <InlineNote tone="error">{kyc.error}</InlineNote>
        </div>
      ) : (
        <div className="grid gap-0 divide-y divide-line-soft lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                <Fingerprint size={17} />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold">1. Verify your NIN</p>
                <p className="muted mt-0.5">
                  Checked with Dojah against the NIMC record.
                </p>
              </div>
            </div>

            {data?.verified_legal_name ? (
              <InlineNote tone="success" title="NIN verified">
                {data.verified_legal_name}
                {data.nin_last4 ? ` ·••• ${data.nin_last4}` : ""}
                {data.nin_verified_at
                  ? ` · ${formatDateTime(data.nin_verified_at)}`
                  : ""}
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
                    onChange={(event) =>
                      setNin(event.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                    placeholder="70123456789"
                    className="font-mono"
                  />
                </Field>
                <Button
                  icon={<BadgeCheck size={14} />}
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

            <div className="flex items-start gap-3 border-t border-line-soft pt-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                <Building2 size={17} />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold">2. Link the settlement bank</p>
                <p className="muted mt-0.5">
                  Resolved with Paystack. The account name must match the NIN name.
                </p>
              </div>
            </div>

            {data?.can_withdraw ? (
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
                  disabled={!data?.verified_legal_name || !bankCode || accountNumber.length !== 10}
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
                {!data?.verified_legal_name ? (
                  <p className="hint">Verify the NIN first — the names must match.</p>
                ) : null}
              </>
            )}
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                <Users size={17} />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold">3. Add the treasurer</p>
                <p className="muted mt-0.5">
                  Every sweep needs their OTP. The rep alone can never move money.
                </p>
              </div>
            </div>

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
              <Field label="Phone number" htmlFor="treasurer-phone" hint="OTP is sent here by SMS.">
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
              icon={<Save size={14} />}
              loading={saveTreasurer.loading}
              disabled={treasurer.name.trim().length < 2 || treasurer.phone.trim().length < 10}
              onClick={() =>
                run(
                  () =>
                    saveTreasurer.run(treasurer.name.trim(), treasurer.phone.trim()),
                  "Treasurer saved",
                  "Sweeps will now wait for their approval.",
                )
              }
            >
              Save treasurer
            </Button>

            <div className="border-t border-line-soft pt-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <ImageIcon size={17} />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold">School logo</p>
                  <p className="muted mt-0.5">
                    Appears on the PDF receipt and the public verification page.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="https://res.cloudinary.com/…/logo.png"
                  aria-label="School logo URL"
                />
                <Button
                  variant="secondary"
                  loading={saveLogo.loading}
                  onClick={() =>
                    run(
                      () => saveLogo.run(logoUrl.trim()),
                      "Logo saved",
                      "New receipts will use it.",
                    )
                  }
                >
                  Save
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-4 text-[12px] text-ink-muted">
              <Pill tone={data?.maturity === "ready" ? "green" : "amber"}>
                {data?.maturity === "ready"
                  ? "Ready for direct settlement"
                  : data?.maturity === "nin_verified"
                    ? "NIN verified · bank pending"
                    : "Verification pending"}
              </Pill>
              {busy ? (
                <span className="flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> checking…
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
