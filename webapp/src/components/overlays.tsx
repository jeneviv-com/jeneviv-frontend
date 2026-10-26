import {
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
import { Loader2, X } from "lucide-react";

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

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const { mounted, visible, panelRef, onBackdropPointerDown } =
    useDialogBehaviour({ open, onClose });
  const titleId = useId();
  const descriptionId = useId();

  const onPanelKeyDown = (event: ReactKeyboardEvent) => {
    // Let Enter submit forms but never bubble a stray Escape out of the dialog.
    if (event.key === "Escape") event.stopPropagation();
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        onPointerDown={onBackdropPointerDown}
        className={`absolute inset-0 bg-ink/45 backdrop-blur-[3px] transition-opacity duration-200 ${
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
        style={{ maxWidth: width }}
        className={`relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[22px] bg-white shadow-pop outline-none transition-[opacity,transform] duration-300 ${PANEL_EASE} sm:max-h-[min(88dvh,860px)] sm:rounded-[18px] ${
          visible
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-8 opacity-0 sm:translate-y-3 sm:scale-[0.985]"
        }`}
      >
        <div
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-pill bg-line sm:hidden"
        />

        <header className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[16.5px] font-bold leading-tight text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="muted mt-1">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-cream hover:text-ink focus-visible:bg-cream"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 sm:px-6">
          {children}
        </div>

        {footer ? (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-line-soft bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end sm:px-6 sm:pb-5 [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </footer>
        ) : (
          <div className="pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4" />
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
  const { mounted, visible, panelRef, onBackdropPointerDown } =
    useDialogBehaviour({ open, onClose });
  const titleId = useId();

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div
        aria-hidden="true"
        onPointerDown={onBackdropPointerDown}
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative z-10 flex h-full w-full max-w-[560px] flex-col overflow-hidden bg-white shadow-pop outline-none transition-transform duration-300 ${PANEL_EASE} ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15.5px] font-bold text-ink">
              {title}
            </h2>
            {subtitle ? <p className="muted mt-0.5">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-cream hover:text-ink"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>

        {footer ? (
          <footer className="shrink-0 border-t border-line-soft px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
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
            {loading ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      {children ?? (
        <p className="muted">
          This action is recorded against your workspace and cannot be undone
          from the dashboard.
        </p>
      )}
    </Modal>
  );
}
