"use client";

import { useState } from "react";

const TABS = [
  {
    id: "create",
    label: "Create",
    text: "Name the collection, set the amount and choose what each payer must tell you. One link is ready in minutes.",
    image: "/assets/images/landing/create.webp",
    alt: "jeneviv collections page showing three live collections with progress",
  },
  {
    id: "collect",
    label: "Collect",
    text: "Payers transfer from any bank. Every payment lands in the ledger with the payer's name and matric number.",
    image: "/assets/images/landing/collect.webp",
    alt: "jeneviv payments list for a CSC 311 handout collection",
  },
  {
    id: "settle",
    label: "Settle",
    text: "Money goes to your verified bank account. Export a clean list for the department whenever they ask.",
    image: "/assets/images/landing/settle.webp",
    alt: "jeneviv transactions page with net, gross and reconciliation totals",
  },
] as const;

export default function ProductTabs() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("create");
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <div className="b-product">
      <div className="b-seg" role="tablist" aria-label="How jeneviv works">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            className={t.id === active ? "is-active" : ""}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="b-product-text">{tab.text}</p>
      <div className="b-shot">
        {TABS.map((t) => (
          <img
            key={t.id}
            src={t.image}
            alt={t.alt}
            width={2160}
            height={1350}
            loading={t.id === "create" ? "eager" : "lazy"}
            className={t.id === active ? "is-active" : ""}
          />
        ))}
      </div>
    </div>
  );
}
