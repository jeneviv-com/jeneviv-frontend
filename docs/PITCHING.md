# Pitching Jeneviv

What you need to know in front of a panel — the product, where the money
actually goes, and the difference between collecting through Paystack and
through Paga.

---

## 1. The one-liner

**Jeneviv turns one payment link into a ledger.** A coordinator creates a
collection, shares a link, and every payer's transfer is matched to a name, a
reference and a status — without screenshots, spreadsheets or manual chasing.

Who it is for: course reps, PTAs, cooperatives, associations, alumni sets —
groups where one person is accountable to thirty or three hundred other people
for money they did not ask to be responsible for.

The problem in one sentence: the money arrives, but the *list* does not. A
WhatsApp group ends up with 80 screenshots and nobody can say who has paid.

---

## 2. How the money moves

Jeneviv never holds the money. There is no Jeneviv wallet and no escrow —
that is a deliberate design choice, not a gap.

```
Payer  →  payment gateway (Paystack or Paga)  →  merchant's own bank account
                     ↓
             signed webhook to Jeneviv
                     ↓
        payment marked paid, ledger row written
```

- The merchant adds a **settlement account** verified by the gateway. Money goes
  there directly, in the merchant's own name.
- Jeneviv's revenue is a **platform fee added to the payer's charge**, not a
  deduction from the merchant's collection.
- A payment is only marked paid when the **gateway's webhook confirms it
  cryptographically**. A payer pressing "I have sent the money" does not mark
  anything paid — it triggers a status re-check against the gateway.

If asked "who is licensed to move money here?" — *the gateway is*. Jeneviv is
the ledger and the workflow on top of licensed infrastructure. Say it exactly
like that; it is both true and the strongest compliance answer available.

---

## 3. The two gateway paths

Both adapters exist in the backend (`src/gateways/paystack`, `src/gateways/paga`)
and are selected by `DEFAULT_GATEWAY`. Only one is live at a time.

### Paystack (the live path)

Used for: creating the charge, verifying settlement accounts, refunds, and
direct settlement to the merchant's bank.

- Each merchant gets a **Paystack subaccount** created from their verified bank
  account; the charge is sent with `subaccount` set, so Paystack settles the
  collection straight to that bank rather than to Jeneviv.
- The payer is charged **collection amount + Jeneviv's platform fee + the
  gateway's processing fee**. The comment in `lib/fees.ts` records this as a
  locked decision: the fee is *not* taken out of the merchant's share (that
  variant is `bearer: "subaccount"`, and on a ₦5,000 collection it leaves the
  merchant about ₦176 short).
- Settlement is **T+1**, weekends rolling to the next working day.
- Refunds are initiated through the gateway and settle asynchronously; the
  webhook is what flips the refund to done.

### Paga (the second path)

Paga Collect works differently in one way that matters to a pitch:

- `POST /paymentRequest` creates a payment request and returns the account
  details the payer transfers to. There is no separate customer object.
- **Paga has no split product for collections.** A payment request has at most
  one `payee`, and `payerCollectionFeeShare` / `payeeCollectionFeeShare` only
  decide who absorbs Paga's own fee — they do not carve out a Jeneviv
  commission the way a Paystack subaccount split does. The adapter is configured
  with `payerCollectionFeeShare: 1`, so the payer absorbs Paga's fee and the
  merchant keeps the full collection amount.
- Authentication is **HTTP Basic** with `publicKey:secretKey`, plus a `hash`
  header: a plain **SHA-512** (not an HMAC) of an operation-specific ordered
  concatenation of request fields with the **hash key appended last**, no
  separators. Get the order wrong and Paga answers `Invalid request hash`.
- Webhooks carry `x-paga-hash`, which is verified the same way before anything
  is marked paid.
- Sandbox is `beta-collect.paga.com`, live is `collect.paga.com`. **Sandbox and
  live have separate keys, and both are IP-allowlisted** — a production Paga
  deployment needs a fixed egress IP, which is why it is not a drop-in swap.

**Current Paga status (be honest if asked):** credentials authenticate and the
hash validates, but `/banks` and `/paymentHistory` return
`statusCode -1, "system error"` on sandbox — a Paga-side failure after auth,
consistent with an account created the same day and not yet provisioned. The
platform runs on Paystack today.

---

## 4. Fees — say these numbers exactly

Platform fee (from `src/lib/fees.ts`):

| Collection amount | Jeneviv fee |
| --- | --- |
| up to ₦7,500 | **₦75 flat** |
| above ₦7,500 | **1%**, never below ₦75 |
| any amount | **capped at ₦1,000** |

Gateway fee (borne by the payer, added on top): Paystack Nigeria pricing modelled
as **1.5% + ₦100** on charges of ₦2,500 and above, capped at ₦2,000 — the cap is
flagged in the code as *unverified* and must be confirmed on Paystack's current
pricing page before quoting it as final. Always say "approximately" for the
gateway fee, and quote the payer total the app shows on the payment page.

A ₦2,500 handout collected from 30 students: ₦75 Jeneviv + roughly ₦138 gateway
per payer. That is the whole economics in one sentence.

---

## 5. What is actually built

Defensible today: collections and payment links, custom fields per collection,
groups, templates, payers list, transactions with filters and CSV export,
instant verification pages and PDF receipts, refunds, bank/settlement accounts,
workspace members with roles (owner / admin / collector / viewer), email
invites, KYC submission with admin review, audit log in the admin area,
profile pictures, notifications.

Deliberately not built: a Jeneviv wallet or escrow, stored card details, a
multi-gateway switch in the UI (the gateway is a server setting), server-side
notifications (the centre is client-side today), and Paga in production.

---

## 6. Giving a judge hands-on access

Do not hand over your own password. Use the access link:

```bash
node tools/access-link.mjs https://app.yourhost.com judge@example.com 'password'
```

It prints `https://app.yourhost.com/access#email=…&password=…`. The page reads the
sign-in from the hash, **strips it from the address bar before calling the API**,
signs in, and lands on the dashboard. If it fails, the page says why and offers a
retry that reuses the credentials already in memory.

Rules that keep this safe:

- Create a **dedicated account with the viewer role**, not an owner account.
- Rotate that account's password after the defence — it revokes every link.
- The link is a password in URL form; treat the chat you send it through as a
  secret channel.

A judge testing the real product should sign up themselves at `/signup` and
create their own workspace — membership is per workspace, so their data is
isolated from yours and cannot touch real collections. Until a staging backend
with Paystack **test** keys exists, tell them to stop before the payment step:
the deployed backend charges real cards.

---

## 7. Questions you will get, and the answers

**"How do you know a payer actually paid?"**
The gateway's signed webhook. A transfer that leaves a payer's bank but arrives
late is caught by a reconciliation job that re-checks the gateway every 15
minutes.

**"What stops someone paying ₦100 against a ₦2,500 collection?"**
Partial payments are refused (`isAllowPartialPayments: false` on Paga, and the
Paystack charge is for the exact amount); a shortfall shows as outstanding and the
payer is told the exact amount to send.

**"Who holds the money?"**
Nobody at Jeneviv. Paystack settles directly to the merchant's verified bank
account via their subaccount. That is why we are not a wallet, and why we do not
need to be a licensed money operator.

**"What happens when two people pay into the same collection at once?"**
Each payment carries its own gateway reference and creates its own ledger row;
the payer's name, matric number or reference is what binds it to a person.

**"Why would anyone pay ₦75 for this?"**
Because the alternative is one person reconciling 300 transfers by hand and
being accused of losing money. The fee is per payment, visible before the payer
sends anything, and there is no subscription.

**"What is your moat?"**
The reconciliation and the audit trail, not the link. Anyone can build a payment
link; making every naira traceable to a name, a reference and a gateway event —
and surviving a panel asking "prove it" — is the product.

**"What about data protection?"**
Minimum payer data (name, identifier, email), NDPA 2023 as the standard we build
to. Do not claim certification; claim alignment and data minimisation.

---

## 8. Things not to claim

- Not "escrow", not "we hold funds in trust" — we do not hold funds.
- Not "we are a payment processor" — the gateway is.
- Not "Paga is integrated and live" — it is coded and blocked on sandbox
  provisioning plus an IP allowlist.
- Not "we store card details" — no card data ever reaches Jeneviv.
- Not "Paystack fee is exactly 1.5% + ₦100" — that is our model of it; the cap is
  unverified.

---

## 9. The 60-second version

> Groups collect money over WhatsApp and lose the list. Jeneviv gives them one
> link, a dashboard and a ledger: who paid, who hasn't, what hit the bank. The
> money settles straight to their own account through licensed infrastructure —
> Paystack today, Paga where it is available — and Jeneviv charges ₦75 or 1% per
> payment, capped, paid by the payer. No wallet, no escrow, no screenshots.
