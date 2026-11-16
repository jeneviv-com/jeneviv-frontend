import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BrandLoader from "@/components/BrandLoader";
import { useAuth } from "@/context/AuthContext";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

/**
 * `/demo` — the link a judge can open with no credentials. The demo dataset
 * lives in the browser, so there is nothing to sign up for and no server state
 * to touch: this signs in as the sample coordinator and hands over the
 * dashboard. If the browser blocks storage, it falls back to the login page
 * instead of looping.
 */
export default function DemoEntry() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (started.current) return;
    started.current = true;

    login(DEMO_EMAIL, DEMO_PASSWORD)
      .then(() => navigate("/dashboard", { replace: true }))
      .catch(() => navigate("/login", { replace: true }));
  }, [isAuthenticated, loading, login, navigate]);

  return <BrandLoader label="Opening the demo workspace…" />;
}
