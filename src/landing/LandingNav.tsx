"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { appUrl } from "@/lib/urls";


const LINKS = [
  { href: "#how-it-works", label: "Product" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#security", label: "Security" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path d="m6 3.5 4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`b-wordmark${light ? " light" : ""}`}>
      jeneviv<em>.</em>
    </span>
  );
}

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="b-topbar">
        <div className="b-frame b-topbar-inner">
          <Link href="/" aria-label="jeneviv home">
            <Wordmark />
          </Link>
          <div className="b-topbar-right">
            <a href={`${appUrl}/login`} className="b-signin">
              Log in
            </a>
            <a href={`${appUrl}/signup`} className="b-btn b-btn-dark b-btn-sm">
              Get started <Chevron />
            </a>
            <button
              type="button"
              className="b-menu-btn"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <nav className={`b-pill${scrolled ? " is-scrolled" : ""}`} aria-label="Main">
        <Link href="/" className="b-pill-mark" aria-label="jeneviv home" tabIndex={scrolled ? 0 : -1}>
          <img src="/assets/images/jeneviv.png" alt="" width={18} height={18} />
        </Link>
        {LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
        <a href="mailto:myjeneviv@gmail.com?subject=jeneviv%20for%20our%20group" className="b-pill-cta">
          Talk to us
        </a>
      </nav>

      {open ? (
        <div className="b-sheet" onClick={() => setOpen(false)}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a href={`${appUrl}/login`}>Log in</a>
        </div>
      ) : null}
    </>
  );
}
