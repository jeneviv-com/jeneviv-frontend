"use client";
import { Dispatch, SetStateAction } from "react";

interface NavbarProps {
  scrolled: boolean;
  mobileOpen: boolean;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
  scrollTo: (id: string) => void;
}

export default function Navbar({
  scrolled,
  mobileOpen,
  setMobileOpen,
  scrollTo,
}: NavbarProps) {
  return (
    <>
      {/* NAV */}
      <nav id="main-nav" className={`nav${scrolled ? " scrolled" : ""}`}>
        <a href="#" className="logo">
          Jeneviv<span className="logo-dot"></span>
        </a>
        <ul className="nav-links">
          <li>
            <button className="nav-link-btn" onClick={() => scrollTo("how")}>
              How it works
            </button>
          </li>
          <li>
            <button className="nav-link-btn" onClick={() => scrollTo("who")}>
              For who
            </button>
          </li>
          <li>
            <button
              className="nav-link-btn"
              onClick={() => scrollTo("payments")}
            >
              Payment infrastructure
            </button>
          </li>
        </ul>
        <button
          className="hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      <div className={`mobile-menu${mobileOpen ? " open" : ""}`}>
        <button onClick={() => scrollTo("how")}>How it works</button>
        <button onClick={() => scrollTo("who")}>For who</button>
        <button onClick={() => scrollTo("payments")}>
          Payment infrastructure
        </button>
      </div>
    </>
  );
}
