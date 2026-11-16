import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandLoader from "@/components/BrandLoader";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/hooks/useApi";
import { Button } from "@/components/ui";

/**
 * `/access` — a link that carries the account it should open.
 *
 * Two shapes are accepted, and the hash form is the one to use:
 *
 *   /access#email=judge@example.com&password=…
 *   /access?email=judge@example.com&password=…
 *
 * The hash never leaves the browser — it is not sent to the server, not
 * included in `Referer`, and not written to proxy logs — which is why it is
 * preferred. Either way the credentials are removed from the address bar as the
 * first thing that happens, before the sign-in call, so they do not sit in
 * history or in a screenshot of the page.
 */
function readCredentials(): { email: string; password: string } | null {
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const fromQuery = new URLSearchParams(window.location.search);
  const pick = (name: string) => fromHash.get(name) ?? fromQuery.get(name);

  const email = (pick("email") ?? pick("user") ?? pick("username") ?? "").trim();
  // Base64 keeps a "&" or "#" inside the password from breaking the link.
  const encoded = pick("password") ?? pick("pass") ?? "";
  let password = encoded;
  try {
    if (pick("e") === "b64" && encoded) password = atob(encoded);
  } catch {
    password = encoded;
  }

  if (!email || !password) return null;
  return { email, password };
}

export default function AccessLink() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (loading) return;

    const credentials = readCredentials();
    // Strip before anything else: the link's job is done once it is read.
    if (credentials || window.location.hash || window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!credentials) {
      setFailure("This link is missing its sign-in details.");
      return;
    }

    if (started.current) return;
    started.current = true;

    login(credentials.email, credentials.password)
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((err: unknown) => setFailure(errorMessage(err)));
  }, [isAuthenticated, loading, login, navigate]);

  if (failure) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col justify-center px-5">
        <p className="eyebrow">Access link</p>
        <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.04em]">
          Could not open that link
        </h1>
        <p className="muted mt-3">{failure}</p>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
          Access links carry a sign-in and can expire or be revoked. Ask for a
          fresh one, or sign in normally.
        </p>
        <Button className="mt-6" onClick={() => navigate("/login", { replace: true })}>
          Go to sign in
        </Button>
        <button
          type="button"
          onClick={() => {
            setFailure(null);
            started.current = false;
          }}
          className="mt-4 text-[12.5px] font-semibold text-ink-muted hover:text-ink"
        >
          Try this link again
        </button>
      </div>
    );
  }

  return <BrandLoader label="Opening your workspace…" />;
}
