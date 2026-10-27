import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Check, ChevronDown, Landmark, Search } from "lucide-react";
import type { Bank } from "@/lib/api";

/**
 * Searchable bank picker.
 *
 * The Nigerian bank list runs to a couple of hundred rows, which is not usable
 * as a plain dropdown. This is a combobox: a trigger that opens a search box
 * with the filtered list right underneath it.
 *
 * The list sits in the normal flow instead of an absolutely positioned popover
 * because the picker is used inside a dialog whose body scrolls — an absolute
 * panel would be clipped by that scroll container.
 */

const MAX_RESULTS = 80;

export default function BankSelect({
  banks,
  value,
  onChange,
  loading = false,
  id,
  placeholder = "Search for your bank",
  loadingLabel = "Loading banks…",
  emptyLabel = "No bank matches that name.",
  unavailableLabel = "We could not load the bank list. Check your connection and try again.",
}: {
  banks: Bank[];
  value: string;
  onChange: (code: string) => void;
  loading?: boolean;
  id?: string;
  placeholder?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  unavailableLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listId = useId();

  const selected = useMemo(
    () => banks.find((bank) => bank.code === value) ?? null,
    [banks, value],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? banks.filter(
          (bank) =>
            bank.name.toLowerCase().includes(needle) ||
            bank.code.toLowerCase().includes(needle),
        )
      : banks;
    return matches.slice(0, MAX_RESULTS);
  }, [banks, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  /* Closing on an outside pointer press keeps the picker from staying open
     while the rest of the dialog is being used. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /* Opening the picker should land the caret in the search box, but only when
     the user has not already moved on to another field. The second attempt
     covers the click that opened it finishing after the re-render. */
  useEffect(() => {
    if (!open) return;
    const focusSearch = () => {
      const active = document.activeElement;
      if (active && active !== document.body) return;
      searchRef.current?.focus();
      listRef.current
        ?.querySelector('[aria-selected="true"]')
        ?.scrollIntoView({ block: "nearest" });
    };
    const frame = requestAnimationFrame(focusSearch);
    const timer = window.setTimeout(focusSearch, 140);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [open]);

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery("");
  };

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const bank = results[activeIndex];
      if (bank) choose(bank.code);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded="false"
        onClick={() => setOpen(true)}
        className={`input flex items-center justify-between gap-3 text-left ${
          selected ? "text-ink" : "text-ink-faint"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <Landmark size={14} className="shrink-0 text-ink-muted" />
          ) : null}
          <span className="truncate">
            {selected ? selected.name : loading ? loadingLabel : placeholder}
          </span>
        </span>
        <ChevronDown size={15} className="shrink-0 text-ink-muted" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div ref={rootRef} className="overflow-hidden rounded-[12px] border border-ink/20 bg-white">
      <div className="relative border-b border-line-soft">
        <Search
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <input
          ref={searchRef}
          id={id}
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder="Type a bank name, e.g. GTBank"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onSearchKeyDown}
          className="w-full bg-transparent py-3 pl-10 pr-3.5 text-[16px] text-ink placeholder:text-ink-faint focus:outline-none sm:text-[14px]"
        />
      </div>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Banks"
        className="max-h-[min(52vh,420px)] overflow-y-auto overscroll-contain py-1 sm:max-h-[236px]"
      >
        {loading ? (
          <li className="px-3.5 py-3 text-[12.5px] text-ink-muted">{loadingLabel}</li>
        ) : results.length === 0 ? (
          <li className="px-3.5 py-3 text-[12.5px] text-ink-muted">
            {banks.length === 0 ? unavailableLabel : emptyLabel}
          </li>
        ) : (
          results.map((bank, index) => {
            const isSelected = bank.code === value;
            return (
              <li key={bank.code} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(bank.code)}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors ${
                    index === activeIndex ? "bg-cream" : "hover:bg-cream/60"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Landmark
                      size={14}
                      className={`shrink-0 ${isSelected ? "text-ink" : "text-ink-faint"}`}
                      aria-hidden="true"
                    />
                    <span className="truncate text-[13.5px] font-medium text-ink">
                      {bank.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[11px] text-ink-faint">
                      {bank.code}
                    </span>
                    {isSelected ? <Check size={13} className="text-ink" /> : null}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      <p className="flex items-center justify-between gap-3 border-t border-line-soft bg-cream/50 px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
        <span>
          {loading || banks.length === 0
            ? "Bank list"
            : `${banks.length} banks`}
        </span>
        <span>Type to search</span>
      </p>
    </div>
  );
}
