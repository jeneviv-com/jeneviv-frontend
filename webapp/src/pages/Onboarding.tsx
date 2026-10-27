import { useState, type ReactNode } from "react";
import { ArrowRight, BadgeCheck, Clock, ShieldAlert, Sparkles } from "lucide-react";
import { merchantsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { errorMessage } from "@/hooks/useApi";
import { Button, Field, InlineNote, Input, TONE_MEANING, Textarea } from "@/components/ui";

const WHAT_NEXT = [
  {
    title: "Name your workspace",
    body: "This is what payers see on the payment page — usually your class, school or organisation.",
  },
  {
    title: "Add a bank account",
    body: "Settlement needs a verified Nigerian bank account in the workspace name.",
  },
  {
    title: "Create your first collection",
    body: "Set the amount, choose the payer fields, share the link in the group chat.",
  },
];

const STATUS_COPY: Record<string, string> = {
  pending: "in review",
  approved: "approved",
  rejected: "not approved",
  suspended: "suspended",
};

function statusCopyFor(status: string | null | undefined) {
  if (!status) return "no application yet";
  return STATUS_COPY[status] ?? status;
}

/** Round icon well used for each state's headline mark. */
function Mark({ tone, children }: { tone: "money" | "attention" | "danger" | "ink"; children: ReactNode }) {
  const styles = {
    money: TONE_MEANING.money,
    attention: TONE_MEANING.attention,
    danger: "bg-[#ffd6cf] text-ink",
    ink: "bg-ink text-cream",
  } as const;
  return (
    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${styles[tone]}`}>
      {children}
    </span>
  );
}

/** A hairline-separated block with a small label, the page's only section style. */
function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <p className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      {children}
    </section>
  );
}

export default function Onboarding() {
  const { merchant, user, refreshMerchant, setMerchant } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [displayName, setDisplayName] = useState(merchant?.display_name || user?.name || "");
  const [note, setNote] = useState(merchant?.application_note || "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const status = merchant?.status ?? null;

  /**
   * Asks the server for the current review state and says what it found, so
   * the button answers the question it is named after instead of silently
   * re-rendering the same screen. When the workspace has been approved, the
   * new status flows into the shell and this page is replaced by the
   * dashboard on the next render.
   */
  const checkStatus = async () => {
    setChecking(true);
    try {
      const { merchant: fresh } = await merchantsAPI.getMe();
      setMerchant(fresh ?? null);
      setCheckedAt(new Date());

      switch (fresh?.status) {
        case "approved":
          success("Your workspace is approved", "You can collect and settle payments now.");
          break;
        case "rejected":
          toastError(
            "Your application was not approved",
            fresh.admin_review_note || fresh.application_note || "Update your details and apply again.",
          );
          break;
        case "suspended":
          toastError("This workspace is suspended", "Email myjeneviv@gmail.com to resolve it.");
          break;
        default:
          info(
            "Still in review",
            "Your application has not been decided yet. We usually reply within one business day.",
          );
      }
    } catch (err) {
      toastError("Could not check your status", errorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setFormError(null);
    try {
      await merchantsAPI.apply(displayName, note);
      await refreshMerchant();
      success(
        "Application submitted",
        "We review new workspaces within one business day. You can set up collections in the meantime.",
      );
    } catch (err) {
      setFormError(errorMessage(err));
      toastError("Could not submit your application", errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------------------ suspended */
  if (status === "suspended") {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <div className="mx-auto mb-6 w-fit">
          <Mark tone="danger">
            <ShieldAlert size={22} />
          </Mark>
        </div>
        <h1 className="text-[26px] font-extrabold tracking-tight">This workspace is suspended</h1>
        <p className="muted mx-auto mt-3 max-w-md">
          Collections and payouts are paused while we review the account. Email{" "}
          <a
            className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:text-brand"
            href="mailto:myjeneviv@gmail.com"
          >
            myjeneviv@gmail.com
          </a>{" "}
          and our team will respond within one business day.
        </p>
      </div>
    );
  }

  /* -------------------------------------------------------------- pending */
  if (status === "pending") {
    const steps = [
      { label: "Application submitted", state: "done" as const },
      { label: "Verification", state: "current" as const },
      { label: "Go live", state: "next" as const },
    ];

    return (
      <div className="mx-auto max-w-2xl space-y-12">
        <div>
          <div className="flex items-start gap-4">
            <Mark tone="attention">
              <Clock size={20} />
            </Mark>
            <div className="min-w-0">
              <h1 className="text-[26px] font-extrabold tracking-tight">Your workspace is under review</h1>
              <p className="muted mt-2 max-w-xl">
                We have your application for{" "}
                <strong className="text-ink">{merchant?.display_name || user?.name}</strong>. Approval
                usually takes less than a business day.
              </p>
            </div>
          </div>

          {/* progress track */}
          <ol className="mt-8 grid grid-cols-3 gap-3">
            {steps.map((step, index) => (
              <li key={step.label} className="relative">
                <div
                  aria-hidden="true"
                  className={`mb-3 h-1.5 w-full rounded-full ${
                    step.state === "done"
                      ? "bg-ink"
                      : step.state === "current"
                        ? "bg-brand"
                        : "bg-line"
                  }`}
                />
                <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-muted">
                  Step {index + 1}
                </p>
                <p className="mt-1 text-[13.5px] font-semibold">{step.label}</p>
                <p className="text-[12px] text-ink-muted">
                  {step.state === "done" ? "Done" : step.state === "current" ? "In review" : "Pending"}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <Block label="Details on file">
          <p className="muted mb-5">
            Update these if anything changed — for example the name payers will recognise on their
            statement.
          </p>
          <div className="space-y-5">
            <Field label="Workspace name" htmlFor="workspace-name">
              <Input
                id="workspace-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </Field>
            <Field
              label="What will you collect?"
              htmlFor="workspace-note"
              hint="Helps our team verify the account faster."
            >
              <Textarea
                id="workspace-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="e.g. Course handouts and departmental levies for 300 level students."
              />
            </Field>
            {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}
            <div className="flex flex-wrap gap-2">
              <Button loading={submitting} onClick={submit}>
                Save changes
              </Button>
              <Button variant="secondary" loading={checking} onClick={checkStatus}>
                Check approval status
              </Button>
            </div>
            {checkedAt ? (
              <p className="hint">
                Last checked {checkedAt.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })} ·
                current status: {statusCopyFor(status)}
              </p>
            ) : null}
          </div>
        </Block>
      </div>
    );
  }

  /* ----------------------------------------------- new workspace / rejected */
  return (
    <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-[1.1fr_0.9fr]">
      {/* the form, as a plain column */}
      <div>
        <Mark tone="money">
          <Sparkles size={20} />
        </Mark>
        <h1 className="mt-6 text-[30px] font-extrabold leading-[1.1] tracking-tight">
          {status === "rejected"
            ? "Let's get your workspace approved"
            : "Set up your collections workspace"}
        </h1>
        <p className="muted mt-3 max-w-md">
          {status === "rejected"
            ? "The last application was not approved. Update the details below and we will take another look."
            : "One short form. You can create collections immediately — approved workspaces collect and settle without limits."}
        </p>

        {status === "rejected" ? (
          <div className="mt-6">
            <InlineNote tone="warning" title="Why it was not approved">
              {merchant?.admin_review_note ||
                "No reason was recorded. Update your details below and apply again, or email myjeneviv@gmail.com."}
            </InlineNote>
          </div>
        ) : null}

        <div className="mt-8 space-y-5">
          <Field
            label="Workspace name"
            htmlFor="apply-name"
            hint="Shown to payers on the payment page and in receipts."
          >
            <Input
              id="apply-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="e.g. CSC 311 Handout Committee"
            />
          </Field>
          <Field
            label="What will you collect?"
            htmlFor="apply-note"
            hint="A sentence is enough — it speeds up verification."
          >
            <Textarea
              id="apply-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Course handout levy for 200 students, ₦2,500 each."
            />
          </Field>
          {formError ? <InlineNote tone="error">{formError}</InlineNote> : null}
          <Button
            size="lg"
            loading={submitting}
            disabled={displayName.trim().length < 2}
            onClick={submit}
          >
            Submit for approval
            <ArrowRight size={15} />
          </Button>
          <p className="hint">
            We never charge to create a workspace. Fees apply per successful payment only.
          </p>
        </div>
      </div>

      {/* the explainer: a numbered line, then one dark block */}
      <div className="space-y-10 lg:pt-16">
        <div>
          <p className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-muted">
            What happens next
          </p>
          <ol className="relative">
            <span aria-hidden="true" className="absolute bottom-3 left-[13px] top-3 w-px bg-line" />
            {WHAT_NEXT.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 pb-7 last:pb-0">
                <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink bg-white text-[12px] font-bold">
                  {index + 1}
                </span>
                <div className="pt-0.5">
                  <p className="text-[14px] font-bold tracking-tight">{step.title}</p>
                  <p className="muted mt-1">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[20px] bg-ink p-6 text-cream">
          <div className="flex items-start gap-3">
            <BadgeCheck size={18} className="mt-0.5 shrink-0 text-brand-peach" />
            <div>
              <p className="text-[14px] font-bold text-white">Money never sits with Jeneviv</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-cream/70">
                Payments are processed by Paystack and settled straight to your verified bank
                account as each one is captured.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
