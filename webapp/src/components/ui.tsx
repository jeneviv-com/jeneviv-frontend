import { Link } from "react-router-dom";
import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Info,
  Loader2,
  Search,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { copyText, initials, statusLabel, statusTone, type Tone } from "@/lib/format";

/* --------------------------------------------------------------- primitives */

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
}) {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
  };
  const sizes = { sm: "btn-sm", md: "", lg: "btn-lg" };
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`btn ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  padded = true,
  interactive = false,
  hoverable = false,
  tone = "default",
  rounded = "card",
  shadow = "card",
  border = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  interactive?: boolean;
  hoverable?: boolean;
  tone?: "default" | "white" | "cream" | "stone" | "brand" | "ink" | "success" | "warning" | "error";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "card" | "full";
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "card" | "float";
  border?: boolean;
}) {
  const toneClasses = {
    default: "bg-white text-ink",
    white: "bg-white text-ink",
    cream: "bg-cream text-ink",
    stone: "bg-stone text-ink",
    brand: "bg-brand-soft text-ink",
    ink: "bg-ink text-white",
    success: "bg-green-50 text-ink border-green-100",
    warning: "bg-amber-50 text-ink border-amber-100",
    error: "bg-red-50 text-ink border-red-100",
  };

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    card: "rounded-card",
    full: "rounded-full",
  };

  const shadowClasses = {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    card: "shadow-card",
    float: "shadow-float",
  };

  const baseClasses = `min-w-0 ${border ? "border" : ""} ${roundedClasses[rounded]} ${shadowClasses[shadow]} ${toneClasses[tone]}`;
  const paddingClass = padded ? "card-pad" : "";
  const interactiveClass = interactive ? "card-interactive" : "";
  const hoverClass = hoverable ? "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5" : "";

  return (
    <section className={`${baseClasses} ${paddingClass} ${interactiveClass} ${hoverClass} ${className}`}>
      {children}
    </section>
  );
}

export function SimpleCard({
  children,
  className = "",
  padding = "md",
  rounded = "xl",
  border = true,
  bg = "white",
}: {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  border?: boolean;
  bg?: "white" | "cream" | "transparent";
}) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
    xl: "p-6",
  };

  const roundedClasses = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
  };

  const bgClasses = {
    white: "bg-white",
    cream: "bg-cream",
    transparent: "bg-transparent",
  };

  const borderClass = border ? "border border-line" : "";

  return (
    <div className={`${borderClass} ${roundedClasses[rounded]} ${bgClasses[bg]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-cream text-ink-soft">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle ? <p className="muted mt-0.5">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </header>
  );
}

export function Pill({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  const map: Record<Tone, string> = {
    green: "pill-green",
    amber: "pill-amber",
    red: "pill-red",
    neutral: "pill-neutral",
    brand: "pill-brand",
    blue: "pill-blue",
  };
  return <span className={`pill ${map[tone]} ${className}`}>{children}</span>;
}

export function StatusPill({ status }: { status?: string | null }) {
  return (
    <Pill tone={statusTone(status)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {statusLabel(status)}
    </Pill>
  );
}

export function Avatar({
  name,
  size = 32,
  tone = "cream",
}: {
  name?: string | null;
  size?: number;
  tone?: "cream" | "brand" | "dark";
}) {
  const tones = {
    cream: "bg-cream text-ink-soft border border-line",
    brand: "bg-brand-soft text-brand",
    dark: "bg-maroon text-cream",
  };
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${tones[tone]}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="error-text">{error}</p>
      ) : hint ? (
        <p className="hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`input ${className}`} />;
}

export function Textarea({
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`input min-h-[88px] ${className}`} />;
}

export function Select({
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...rest} className={`input appearance-none pr-9 ${className}`}>
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
        aria-hidden="true"
      />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[13.5px] font-semibold text-ink">{label}</p>
        {description ? <p className="muted mt-0.5">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-pill border transition-colors ${
          checked ? "border-ink bg-ink" : "border-line bg-cream-deep"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
          style={{ width: 18, height: 18 }}
        />
      </button>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        aria-hidden="true"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input pl-9"
        type="search"
      />
    </div>
  );
}

/**
 * The one filter control on a page: a filter icon and the word "Filters", with
 * the choices tucked inside the panel. The old inline segmented rows took up a
 * whole strip of the page for options nobody reads twice.
 */
export function FilterMenu({
  groups,
  label = "Filters",
  className = "",
}: {
  groups: Array<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string; count?: number }>;
  }>;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // A group counts as active when it is not on its first (usually "all") choice.
  const activeCount = groups.filter((group) => group.value !== group.options[0]?.value).length;

  return (
    <div className={`relative ${className}`} ref={box}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex h-[42px] items-center gap-2 rounded-[10px] border px-3 text-[12.5px] font-semibold transition-colors ${
          open || activeCount
            ? "border-ink bg-ink text-cream"
            : "border-line bg-white text-ink-soft hover:border-ink/25 hover:text-ink"
        }`}
      >
        <SlidersHorizontal size={14} aria-hidden="true" />
        {label}
        {activeCount ? (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 top-[calc(100%+8px)] z-30 w-[252px] animate-pop-in rounded-[14px] border border-line bg-white p-2 shadow-pop"
        >
          {groups.map((group) => (
            <div key={group.label} className="mb-1 last:mb-0">
              <p className="px-2 pb-1.5 pt-1 font-mono text-3xs uppercase tracking-[0.14em] text-ink-faint">
                {group.label}
              </p>
              {group.options.map((option) => {
                const active = option.value === group.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      group.onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-[9px] px-2 py-2 text-left text-[12.5px] transition-colors ${
                      active ? "bg-ink font-semibold text-cream" : "text-ink-soft hover:bg-cream hover:text-ink"
                    }`}
                  >
                    <span className="flex-1 truncate">{option.label}</span>
                    {option.count !== undefined ? (
                      <span className={`tabular text-[11px] ${active ? "text-cream/70" : "text-ink-faint"}`}>
                        {option.count}
                      </span>
                    ) : null}
                    {active ? <Check size={13} aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-[11px] border border-line bg-white p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
              active
                ? "bg-ink text-white"
                : "text-ink-muted hover:bg-cream hover:text-ink"
            }`}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={`ml-1.5 tabular ${active ? "text-white/70" : "text-ink-faint"}`}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyText(value);
        if (ok) setCopied(true);
      }}
      className={`btn btn-secondary btn-sm ${className}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: cols }).map((__, colIndex) => (
            <Skeleton
              key={colIndex}
              className={`h-4 ${colIndex === 0 ? "w-1/4" : "w-1/6"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-cream text-ink-muted">
        {icon ?? <Info size={20} />}
      </span>
      <h3 className="mt-4 text-[15px] font-bold text-ink">{title}</h3>
      <p className="muted mt-1.5 max-w-sm">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fdecea] text-danger">
        <TriangleAlert size={19} />
      </span>
      <h3 className="mt-4 text-[15px] font-bold text-ink">
        We couldn&apos;t load this
      </h3>
      <p className="muted mt-1.5 max-w-md">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/* Dialogs live in their own module so they can render through a portal.
   Re-exported here to keep the single dashboard import surface. */
export { Modal, Drawer, ConfirmDialog } from "./overlays";

export function Toolbar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 border-b border-line-soft px-4 py-3 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[24px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function KeyValue({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-line-soft py-2.5 last:border-b-0">
      <span className="text-[12.5px] text-ink-muted">{label}</span>
      <span
        className={`text-right text-[13px] font-semibold text-ink ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function InlineNote({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "success" | "error";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: {
      wrap: "border-[#d7e3f5] bg-[#f4f8fd] text-[#1d4f91]",
      icon: <Info size={15} />,
    },
    warning: {
      wrap: "border-[#f2dfb6] bg-[#fffaef] text-[#8a5d00]",
      icon: <AlertCircle size={15} />,
    },
    success: {
      wrap: "border-[#c9ecdb] bg-[#f1fbf6] text-[#0c6742]",
      icon: <CheckCircle2 size={15} />,
    },
    error: {
      wrap: "border-[#f4cecb] bg-[#fdf2f1] text-[#a92b22]",
      icon: <TriangleAlert size={15} />,
    },
  };
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed ${tones[tone].wrap}`}
    >
      <span className="mt-0.5 shrink-0">{tones[tone].icon}</span>
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "brand",
}: {
  value: number;
  tone?: "brand" | "green" | "ink";
}) {
  const tones = {
    brand: "bg-brand",
    green: "bg-success",
    ink: "bg-ink",
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-pill bg-line-soft">
      <div
        className={`h-full rounded-pill ${tones[tone]} transition-all`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
  footer,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "brand" | "dark" | "green";
  icon?: ReactNode;
  footer?: ReactNode;
}) {
  const styles = {
    neutral: "bg-white border-line text-ink",
    brand: "bg-brand-soft border-[#ffe0d2] text-ink",
    dark: "bg-maroon border-maroon text-white",
    green: "bg-[#f1fbf6] border-[#c9ecdb] text-ink",
  };
  const mutedTone = tone === "dark" ? "text-white/55" : "text-ink-muted";
  return (
    <div className={`rounded-card border p-5 ${styles[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p
          className={`font-mono text-3xs uppercase tracking-[0.14em] ${
            tone === "dark" ? "text-white/45" : "text-ink-muted"
          }`}
        >
          {label}
        </p>
        {icon ? (
          <span
            className={tone === "dark" ? "text-brand" : "text-ink-muted"}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="tabular mt-3 text-[26px] font-extrabold leading-none tracking-tight">
        {value}
      </p>
      {hint ? <p className={`mt-2 text-[12px] ${mutedTone}`}>{hint}</p> : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (value: T) => void;
  tabs: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line pb-px no-scrollbar">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
              active
                ? "border-brand text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Unified StackedCard component that handles both mobile stacking and laptop grid layout.
 * On mobile: cards stack with negative margin-top
 * On laptop (lg): cards reset margin and display in grid
 */
export function StackedCard({
  children,
  className = "",
  tone = "default",
  interactive = false,
  href,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  tone?: "black" | "purple" | "orange" | "cyan" | "pink" | "green" | "default" | "lavender" | "peach" | "mint" | "aqua" | "ink";
  interactive?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const tones = {
    black: "bg-[#000000] text-white border-black",
    purple: "bg-[#CBBEEF] text-ink border-black",
    orange: "bg-[#FDB882] text-ink border-black",
    cyan: "bg-[#76EAE8] text-ink border-black",
    pink: "bg-[#F68C8B] text-ink border-black",
    green: "bg-[#B1F373] text-ink border-black",
    default: "bg-white text-ink border-line",
    lavender: "bg-[#dcd5f3] text-ink border-ink/15",
    peach: "bg-[#f9d3b0] text-ink border-ink/15",
    mint: "bg-[#d5e8c4] text-ink border-ink/15",
    aqua: "bg-[#d3e9ee] text-ink border-ink/15",
    ink: "bg-[#101010] text-white border-ink",
  };

  const baseClasses = `relative -mt-6 first:mt-0 lg:mt-0 rounded-[20px] border px-5 py-5 shadow-sm lg:min-h-[92px] lg:px-6 lg:py-5 ${tones[tone]}`;
  const interactiveClasses = interactive 
    ? "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2" 
    : "";

  const content = (
    <div className={`${baseClasses} ${interactiveClasses} ${className}`}>
      {children}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}

/**
 * Container for stacked cards that properly handles mobile stacking and laptop grid
 */
/**
 * The one container for summary cards on every page. On phones it is a single
 * bordered panel with a rule between rows. On laptop the rows are separate rounded
 * cards, laid out in `columns` columns. Change the look here and every page follows.
 */
export function SummaryPanel({
  children,
  columns = 2,
  className = "",
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const laptopGrid = {
    1: "",
    2: "lg:grid lg:grid-cols-2 lg:gap-4",
    3: "lg:grid lg:grid-cols-3 lg:gap-4",
  }[columns];
  return (
    <div
      className={`relative overflow-hidden rounded-[26px] border-[1.5px] border-ink bg-white divide-y-[1.5px] divide-ink lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:divide-y-0 ${laptopGrid} ${className}`}
    >
      {children}
    </div>
  );
}

/** Same as SummaryPanel, with the older `gridLayout` switch. Kept so existing callers work. */
export function StackedCards({
  children,
  className = "",
  gridLayout = false,
}: {
  children: ReactNode;
  className?: string;
  gridLayout?: boolean;
}) {
  return (
    <SummaryPanel columns={gridLayout ? 2 : 1} className={className}>
      {children}
    </SummaryPanel>
  );
}

/**
 * Dashboard metric card - optimized for dashboard usage
 */
export function SummaryRow({
  title,
  subtitle,
  value,
  tone = "lavender",
  icon,
  href,
  loading = false,
}: {
  title: string;
  subtitle: string;
  value: ReactNode;
  /** A colour from the shared palette, or a meaning such as "money" or "attention". */
  tone?: ToneCardTone | ToneKind;
  icon?: ReactNode;
  href?: string;
  loading?: boolean;
}) {
  const toneClass =
    tone in TONE_CARD
      ? TONE_CARD[tone as ToneCardTone]
      : TONE_MEANING[tone as ToneKind];

  const panel = (
    <div
      className={`relative flex min-h-[112px] flex-col justify-between gap-3 overflow-hidden px-[22px] py-[18px] lg:min-h-[140px] lg:rounded-[22px] lg:border lg:border-ink/10 lg:p-5 lg:shadow-[0_1px_2px_rgba(16,16,16,0.04)] ${toneClass} ${
        href ? "transition-[filter] duration-150 hover:brightness-[0.985] active:brightness-95" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[10.5px] font-normal uppercase tracking-[0.14em] opacity-60">
          {title}
        </p>
        {icon ? (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/60">{icon}</span>
        ) : href ? (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/45 opacity-70">
            <ArrowUpRight size={13} aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="tabular text-[26px] font-extrabold leading-none tracking-[-0.03em] lg:text-[30px]">
          {loading ? (
            <span aria-hidden="true" className="skeleton inline-block h-6 w-20 rounded-md" />
          ) : (
            value
          )}
        </p>
        <p className="mt-2 truncate text-[12px] opacity-65">{subtitle}</p>
      </div>
    </div>
  );

  return href ? (
    <Link to={href} className="block">
      {panel}
    </Link>
  ) : (
    panel
  );
}

/** Kept so existing callers work. Same as SummaryRow. */
export const DashboardMetricCard = SummaryRow;

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return useMemo(() => debounced, [debounced]);
}

/* ------------------------------------------------------------- tone cards */

/** The pastel palette used by the dashboard summary cards. */
export const TONE_CARD = {
  ink: "bg-[#101010] text-white",
  lavender: "bg-[#dcd5f3] text-ink",
  peach: "bg-[#f9d3b0] text-ink",
  mint: "bg-[#d5e8c4] text-ink",
  aqua: "bg-[#d3e9ee] text-ink",
} as const;

export type ToneCardTone = keyof typeof TONE_CARD;

/* ------------------------------------------------------- semantic tones */

/**
 * Colour by meaning, not by page. Use these in new code. Each one should be
 * paired with a text label, so colour is never the only signal.
 *   money     – money in or settled
 *   people    – payers, collections and counts
 *   attention – waiting, pending, paused or needs action
 *   neutral   – information, completion and settings
 *   headline  – the one main figure on a page
 */
export const TONE_MEANING = {
  money: TONE_CARD.mint,
  people: TONE_CARD.lavender,
  attention: TONE_CARD.peach,
  neutral: TONE_CARD.aqua,
  headline: TONE_CARD.ink,
} as const;

export type ToneKind = keyof typeof TONE_MEANING;