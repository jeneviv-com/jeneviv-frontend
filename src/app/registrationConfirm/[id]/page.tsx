import Link from "next/link";
import AuthShell from "../../../components/AuthShell";

export default async function RegistrationConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return (
    <AuthShell>
      <div className="auth-confirm">
        <div className="auth-confirm-check" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="80" height="80">
            <circle cx="32" cy="32" r="32" fill="#1FAE5C" />
            <path
              d="M18 33 l10 10 l18 -22"
              stroke="#fff"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="auth-confirm-title">Account confirmed</h1>
        <Link href="/auth/login" className="auth-confirm-btn">
          Log in
        </Link>
      </div>
    </AuthShell>
  );
}
