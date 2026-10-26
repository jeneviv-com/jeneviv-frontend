import {
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Loader2, ShieldCheck, TriangleAlert, X } from "lucide-react";

/**
 * Dialogs render through a portal on `document.body`. Without the portal a
 * `position: fixed` overlay is trapped by any ancestor that creates a
 * containing block (transform, filter, will-change) — which is exactly what
 * the animated page wrapper does, so modals used to appear clipped and
 * unclickable inside the dashboard.
 *
 * Scroll locking is reference-counted because a confirm dialog can open on top
 * of a drawer.
 */
let scrollLocks = 0;
let previousBodyOverflow = "";

function lockBodyScroll() {
  if (scrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLocks += 1;
}

function unlockBodyScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.body.style.overflow = previousBodyOverflow;
}

function useDialogBehaviour({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Keep the panel mounted for one frame after `open` flips false so the exit
  // transition can play instead of the dialog disappearing instantly.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 220);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    lockBodyScroll();
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () => {
      const root = panelRef.current;
      if (!root) return [] as HTMLElement[];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
    };

    const focusTimer = window.setTimeout(() => {
      const root = panelRef.current;
      // Prefer the first form control so a dialog that asks for input is ready
      // to type in, instead of landing on the close button.
      const control = root?.querySelector<HTMLElement>(
        '[data-autofocus], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
      );
      const target = control ?? focusables()[0] ?? root;
      target?.focus({ preventScroll: true });
    }, 40);

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const list = focusables();
      if (list.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey, true);
      unlockBodyScroll();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  const onBackdropPointerDown = (event: ReactPointerEvent) => {
    // Only close when the gesture starts and ends on the backdrop; dragging a
    // text selection out of the panel should not dismiss it.
    if (event.target === event.currentTarget) closeRef.current();
  };

  return {
    mounted,
    visible,
    panelRef,
    onBackdropPointerDown,
  };
}

const PANEL_EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/** The area of the screen not covered by the on-screen keyboard. */
export function useVisualViewport() {
  const [area, setArea] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setArea({ top: vv.offsetTop, height: vv.height });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return area;
}

/* ---------------------------------------------------------------- pieces */

/** Round icon well shown in a dialog header. Tones match the app's meanings. */
function DialogMark({ tone, children }: { tone: "money" | "attention" | "danger" | "neutral"; children: ReactNode }) {
  const styles = {
    money: "bg-[#c8f58e] text-ink",
    attention: "bg-[#ffc49a] text-ink",
    danger: "bg-[#ffd6cf] text-ink",
    neutral: "bg-[#9ff0f5] text-ink",
  } as const;
  return (
    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${styles[tone]}`}>{children}</span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 520,
  icon,
  tone = "neutral",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  icon?: ReactNode;
  tone?: "money" | "attention" | "danger" | "neutral";
}) {
  const { mounted, visible, panelRef, onBackdropPointerDown } = useDialogBehaviour({ open, onClose });
  const area = useVisualViewport();
  const titleId = useId();
  const descriptionId = useId();

  const onPanelKeyDown = (event: ReactKeyboardEvent) => {
    // Let Enter submit forms but never bubble a stray Escape out of the dialog.
    if (event.key === "Escape") event.stopPropagation();
  };

  // When a field gets focus the keyboard opens over it. Wait for the keyboard
  // to finish animating, then centre the field in the visible area.
  const keepFieldVisible = (event: ReactFocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.matches("input, textarea, select")) return;
    window.setTimeout(() => target.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
      style={area ? { top: area.top, height: area.height, bottom: "auto" } : undefined}
    >
      <div
        aria-hidden="true"
        onPointerDown={onBackdropPointerDown}
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[4px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        onFocus={keepFieldVisible}
        style={{ maxWidth: width }}
        className={`relative z-10 flex max-h-[92%] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-pop outline-none transition-[opacity,transform] duration-300 ${PANEL_EASE} sm:max-h-[min(88dvh,860px)] sm:rounded-[24px] ${
          visible ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-8 opacity-0 sm:translate-y-3 sm:scale-[0.985]"
        }`}
      >
        <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-11 shrink-0 rounded-full bg-line sm:hidden" />

        <header className="flex shrink-0 items-start gap-4 px-6 pb-5 pt-6 sm:pt-7">
          {icon ? <DialogMark tone={tone}>{icon}</DialogMark> : null}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id={titleId} className="text-[19px] font-bold leading-tight tracking-[-0.02em] text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="muted mt-1.5">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-ink-muted transition-colors hover:bg-cream-deep hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
            aria-label="Close dialog"
          >
            <X size={15} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">{children}</div>

        {footer ? (
          <footer className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-line bg-cream/60 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </footer>
        ) : (
          <div className="pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6" />
        )}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { mounted, visible, panelRef, onBackdropPointerDown } = useDialogBehaviour({ open, onClose });
  const area = useVisualViewport();
  const titleId = useId();

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex justify-end"
      style={area ? { top: area.top, height: area.height, bottom: "auto" } : undefined}
    >
      <div
        aria-hidden="true"
        onPointerDown={onBackdropPointerDown}
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[4px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative z-10 flex h-full w-full max-w-[580px] flex-col overflow-hidden bg-white shadow-pop outline-none transition-transform duration-300 sm:rounded-l-[28px] ${PANEL_EASE} ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 px-6 pb-5 pt-7">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Details</p>
            <h2 id={titleId} className="mt-1.5 truncate text-[20px] font-bold tracking-[-0.02em] text-ink">
              {title}
            </h2>
            {subtitle ? <p className="muted mt-1 truncate font-mono text-[12px]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-ink-muted transition-colors hover:bg-cream-deep hover:text-ink"
            aria-label="Close panel"
          >
            <X size={15} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-8">{children}</div>

        {footer ? (
          <footer className="shrink-0 border-t border-line bg-cream/60 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  loading,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const confirm = useCallback(() => {
    if (!loading) onConfirm();
  }, [loading, onConfirm]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      width={440}
      tone={destructive ? "danger" : "money"}
      icon={destructive ? <TriangleAlert size={19} /> : <ShieldCheck size={19} />}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${destructive ? "btn-danger" : "btn-primary"}`}
            onClick={confirm}
            disabled={loading}
          >
            {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      {children ?? (
        <p className="muted">This action is recorded against your workspace and cannot be undone from the dashboard.</p>
      )}
    </Modal>
  );
}
