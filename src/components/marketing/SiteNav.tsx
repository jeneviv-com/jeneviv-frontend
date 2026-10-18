"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";

type MenuItem = { title: string; sub: string; href: string };

const PRODUCT: MenuItem[] = [
  {
    title: "Collections",
    sub: "One link, a fixed amount, every payer tracked.",
    href: "#collections",
  },
  {
    title: "Payment links",
    sub: "Share once. Payers never install an app.",
    href: "#collections",
  },
  {
    title: "Payouts & settlement",
    sub: "Twice-daily transfers straight to your bank.",
    href: "#settlement",
  },
  {
    title: "Reconciliation",
    sub: "Every transfer matched, automatically.",
    href: "#reconciliation",
  },
];

const SOLUTIONS: MenuItem[] = [
  {
    title: "Universities",
    sub: "Course reps, handouts, departmental levies.",
    href: "#use-cases",
  },
  {
    title: "PTAs & schools",
    sub: "Termly levies without the receipt pile.",
    href: "#use-cases",
  },
  {
    title: "Cooperatives",
    sub: "Monthly thrift and member contributions.",
    href: "#use-cases",
  },
  {
    title: "Associations",
    sub: "Annual dues, events and building funds.",
    href: "#use-cases",
  },
];

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M1.5 3.5 5 7l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Menu({
  label,
  items,
  open,
  onOpen,
  onClose,
}: {
  label: string;
  items: MenuItem[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div
      className="m-nav-item"
      onMouseEnter={() => {
        if (timer.current) clearTimeout(timer.current);
        onOpen();
      }}
      onMouseLeave={() => {
        timer.current = setTimeout(onClose, 120);
      }}
    >
      <button
        type="button"
        className="m-nav-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => (open ? onClose() : onOpen())}
      >
        {label}
        <Chevron />
      </button>
      {open && (
        <div className="m-menu" role="menu">
          {items.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="m-menu-link"
              role="menuitem"
              onClick={onClose}
            >
              <span className="m-menu-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 16 16">
                  <path
                    d="M3 11.5 6.2 8l2.4 2.2L13 4.8M3 4.5h4M3 8h2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>
                <span className="m-menu-title">{item.title}</span>
                <span className="m-menu-sub">{item.sub}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"product" | "solutions" | null>(
    null,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="m-nav-shell" data-scrolled={scrolled}>
      <div className="m-wrap">
        <nav className="m-nav" aria-label="Main">
          <Link href="/" className="m-logo" aria-label="Jeneviv home">
            jeneviv<em>.</em>
          </Link>

          <div className="m-nav-links">
            <Menu
              label="Product"
              items={PRODUCT}
              open={openMenu === "product"}
              onOpen={() => setOpenMenu("product")}
              onClose={() => setOpenMenu(null)}
            />
            <Menu
              label="Solutions"
              items={SOLUTIONS}
              open={openMenu === "solutions"}
              onOpen={() => setOpenMenu("solutions")}
              onClose={() => setOpenMenu(null)}
            />
            <a
              href="#pricing"
              className="m-nav-anchor"
              onClick={() => setOpenMenu(null)}
            >
              Pricing
            </a>
            <a
              href="#security"
              className="m-nav-anchor"
              onClick={() => setOpenMenu(null)}
            >
              Security
            </a>
          </div>

          <div className="m-nav-right">
            <a href={`${appUrl}/login`} className="m-btn m-btn-outline m-btn-sm">
              Log in
            </a>
            <a href={`${appUrl}/signup`} className="m-btn m-btn-primary m-btn-sm">
              Create an account
              <Arrow />
            </a>
          </div>

          <button
            type="button"
            className="m-burger"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  d="m4 4 10 10M14 4 4 14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  d="M2 5h14M2 9h14M2 13h14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </nav>
      </div>

      <div className="m-mobile" data-open={mobileOpen}>
        <a href="#collections" onClick={() => setMobileOpen(false)}>
          Product
        </a>
        <a href="#use-cases" onClick={() => setMobileOpen(false)}>
          Solutions
        </a>
        <a href="#pricing" onClick={() => setMobileOpen(false)}>
          Pricing
        </a>
        <a href="#security" onClick={() => setMobileOpen(false)}>
          Security
        </a>
        <div className="m-mobile-actions">
          <a href={`${appUrl}/login`} className="m-btn m-btn-outline">
            Log in
          </a>
          <a href={`${appUrl}/signup`} className="m-btn m-btn-primary">
            Create an account
            <Arrow />
          </a>
        </div>
      </div>
    </div>
  );
}
