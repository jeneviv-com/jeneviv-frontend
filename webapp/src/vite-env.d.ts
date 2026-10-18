/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_PUBLIC_APP_URL?: string;
  /** Origin used for public payer links, e.g. https://pay.jeneviv.com */
  readonly VITE_PAY_BASE_URL?: string;
  readonly VITE_APP_NAME?: string;
  /** "auto" (default) | "true" | "false" — see src/lib/demo/index.ts */
  readonly VITE_DEMO_MODE?: string;
  /** Router base path, e.g. "/app" when the dashboard is mounted on a subpath */
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
