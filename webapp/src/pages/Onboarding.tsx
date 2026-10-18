import { useState } from "react";
import { ArrowRight, BadgeCheck, Clock, ShieldAlert, Sparkles } from "lucide-react";
import { merchantsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { errorMessage } from "@/hooks/useApi";
import { Button, Card, Field, InlineNote, Input, Textarea } from "@/components/ui";

const STEPS = [
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

export default function Onboarding() {
  const { merchant, user, refreshMerchant } = useAuth();
  const { success, error: toastError } = useToast();

  const [displayName, setDisplayName] = useState(
    merchant?.display_name || user?.name || "",
  );
  const [note, setNote] = useState(merchant?.application_note || "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const status = merchant?.status ?? null;

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

  if (status === "suspended") {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fdecea] text-danger">
              <ShieldAlert size={20} />
            </span>
            <div>
              <h1 className="text-[19px] font-extrabold tracking-tight">
                This workspace is suspended
              </h1>
              <p className="muted mt-2">
                Collections and payouts are paused while we review the account.
                Email{" "}
                <a
                  className="font-semibold text-brand underline underline-offset-2"
                  href="mailto:myjeneviv@gmail.com"
                >
                  myjeneviv@gmail.com
                </a>{" "}
                and our team will respond within one business day.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="mb-4">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff3dd] text-warning">
              <Clock size={20} />
            </span>
            <div className="flex-1">
              <h1 className="text-[19px] font-extrabold tracking-tight">
                Your workspace is under review
              </h1>
              <p className="muted mt-2">
                We have your application for{" "}
                <strong className="text-ink">
                  {merchant?.display_name || user?.name}
                </strong>
                . Approval usually takes less than a business day.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["1", "Application submitted", "Done"],
                  ["2", "Verification", "In review"],
                  ["3", "Go live", "Pending"],
                ].map(([step, label, state]) => (
                  <div
                    key={step}
                    className={`rounded-xl border px-3.5 py-3 ${
                      state === "Done"
                        ? "border-[#c9ecdb] bg-[#f1fbf6]"
                        : state === "In review"
                          ? "border-[#f2dfb6] bg-[#fffaef]"
                          : "border-line bg-cream"
                    }`}
                  >
                    <p className="font-mono text-3xs uppercase tracking-[0.14em] text-ink-muted">
                      Step {step}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold">{label}</p>
                    <p className="text-[11.5px] text-ink-muted">{state}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="section-title">Details on file</h2>
          <p className="muted mt-1">
            Update these if anything changed — for example the name payers will
            recognise on their statement.
          </p>
          <div className="mt-4 space-y-4">
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
              <Button
                variant="secondary"
                onClick={() => refreshMerchant()}
              >
                Check approval status
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
          <Sparkles size={20} />
        </span>
        <h1 className="mt-4 text-[21px] font-extrabold tracking-tight">
          {status === "rejected"
            ? "Let's get your workspace approved"
            : "Set up your collections workspace"}
        </h1>
        <p className="muted mt-2">
          {status === "rejected"
            ? "The last application was not approved. Update the details below and we will take another look."
            : "One short form. You can create collections immediately — approved workspaces collect and settle without limits."}
        </p>

        {status === "rejected" && merchant?.application_note ? (
          <InlineNote tone="warning" title="Reviewer note">
            {merchant.application_note}
          </InlineNote>
        ) : null}

        <div className="mt-5 space-y-4">
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
          <p className="hint text-center">
            We never charge to create a workspace. Fees apply per successful
            payment only.
          </p>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <h2 className="section-title">What happens next</h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-maroon text-3xs font-bold text-cream">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold">{step.title}</p>
                  <p className="muted mt-0.5">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="bg-maroon text-cream" padded>
          <div className="flex items-start gap-3">
            <BadgeCheck size={18} className="mt-0.5 text-brand-peach" />
            <div>
              <p className="text-[13.5px] font-semibold text-white">
                Money never sits with Jeneviv
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#d9c7c0]">
                Payments are processed by Flutterwave and settled straight to
                your verified bank account, twice daily.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
