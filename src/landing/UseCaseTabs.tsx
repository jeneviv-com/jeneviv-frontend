"use client";

import { useState } from "react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";

const CASES = [
  {
    id: "reps",
    label: "Course reps",
    title: "Handouts and class levies",
    body: "Collect for handouts, manuals and lab fees without keeping a list in your notes app.",
    points: ["Payment matched to matric number", "Receipt in every student's inbox", "List of who hasn't paid", "Export for the department"],
    file: "csc311_handout.csv",
    rows: [
      ["Adaeze Okonkwo", "20/ENG/001", "2,500.00", "paid"],
      ["Emeka Nwosu", "20/ENG/004", "2,500.00", "paid"],
      ["Fatima Musa", "20/ENG/007", "2,500.00", "pending"],
      ["Ibrahim Kalu", "20/ENG/012", "2,500.00", "paid"],
    ],
  },
  {
    id: "pta",
    label: "PTAs & schools",
    title: "Termly levies",
    body: "Parents pay by transfer and the school gets one clean report, with no envelopes or tellers.",
    points: ["Ask for the child's name and class", "Parents pay from any bank", "Report ready for the bursar", "Pause after the deadline"],
    file: "pta_levy_second_term.csv",
    rows: [
      ["Mrs Okafor", "JSS 2B", "15,000.00", "paid"],
      ["Mr Bello", "SSS 1A", "15,000.00", "paid"],
      ["Mrs Eze", "JSS 3C", "15,000.00", "pending"],
      ["Mr Danjuma", "SSS 2B", "15,000.00", "paid"],
    ],
  },
  {
    id: "coop",
    label: "Cooperatives",
    title: "Monthly thrift",
    body: "Members pay from any bank and every contribution is matched to the member record, month after month.",
    points: ["One link for every month", "Contributions matched by member ID", "Running totals per member", "Statements for the AGM"],
    file: "greenfield_thrift_nov.csv",
    rows: [
      ["Tunde Adewale", "GF014", "10,000.00", "paid"],
      ["Ngozi Kalu", "GF022", "10,000.00", "paid"],
      ["Musa Ibrahim", "GF031", "10,000.00", "paid"],
      ["Grace Etim", "GF040", "10,000.00", "pending"],
    ],
  },
  {
    id: "assoc",
    label: "Associations",
    title: "Dues and building funds",
    body: "Annual dues, event levies and project contributions, with a list any committee can audit.",
    points: ["Dues by membership number", "Share one link in the group", "Treasurer sees the same ledger", "Clean list for the audit"],
    file: "nacos_annual_dues.csv",
    rows: [
      ["Chidi Obi", "NACOS 118", "5,000.00", "paid"],
      ["Amaka Ibe", "NACOS 121", "5,000.00", "paid"],
      ["Yusuf Bello", "NACOS 133", "5,000.00", "paid"],
      ["Efe Johnson", "NACOS 140", "5,000.00", "pending"],
    ],
  },
] as const;

const CheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="m6.6 10.2 2.3 2.2 4.5-4.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function UseCaseTabs() {
  const [active, setActive] = useState<(typeof CASES)[number]["id"]>("reps");
  const c = CASES.find((x) => x.id === active)!;

  return (
    <div>
      <div className="b-tabs" role="tablist" aria-label="Who uses jeneviv">
        {CASES.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={x.id === active}
            className={x.id === active ? "is-active" : ""}
            onClick={() => setActive(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="b-case">
        <div className="b-case-copy">
          <h3>{c.title}</h3>
          <p>{c.body}</p>
          <ul>
            {c.points.map((p) => (
              <li key={p}>
                <CheckCircle /> {p}
              </li>
            ))}
          </ul>
          <a href={`${appUrl}/signup`} className="b-btn b-btn-outline">
            Create a collection
          </a>
        </div>

        <div className="b-case-visual">
          <div className="b-window">
            <div className="b-window-bar">
              <span className="b-dots">
                <i />
                <i />
                <i />
              </span>
              <span>export {c.file}</span>
            </div>
            <div className="b-window-body">
              <p className="b-code-muted">name, id, amount, status</p>
              {c.rows.map(([name, id, amount, status]) => (
                <p key={id}>
                  <span>{name}</span>, <span className="b-code-id">{id}</span>, <span>{amount}</span>,{" "}
                  <span className={status === "paid" ? "b-code-ok" : "b-code-wait"}>{status}</span>
                </p>
              ))}
            </div>
          </div>
          <div className="b-terminal">
            <p>
              <span className="b-code-ok">✓</span> 12:04:02 transfer received ₦{c.rows[0][2]}
            </p>
            <p>
              <span className="b-code-ok">✓</span> 12:04:05 matched {c.rows[0][1]}
            </p>
            <p>
              <span className="b-code-ok">✓</span> 12:04:09 receipt sent
            </p>
            <p className="b-code-muted">→ settles to your bank account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
