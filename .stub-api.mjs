// Temporary local stub of the Jeneviv API — used only to verify the group
// detail page and the /api/payments/init payload in a browser. Delete after use.
import http from "node:http";

const groups = [
  {
    id: "grp1",
    name: "Kings College Lagos",
    description: "Senior secondary school fees and levies.",
    logo_url: null,
    collection_count: 2,
    created_at: "2026-01-05",
    updated_at: "2026-01-05",
  },
  {
    id: "grp2",
    name: "Unity Secondary School",
    description: "Second group, no collections yet.",
    logo_url: null,
    collection_count: 0,
    created_at: "2026-02-01",
    updated_at: "2026-02-01",
  },
];

const collections = [
  {
    id: "col1",
    group_id: "grp1",
    short_code: "tuition1",
    name: "Tuition 2026",
    description: "First term tuition",
    amount: 50000,
    currency: "NGN",
    is_active: true,
    created_at: "2026-01-06",
    stats: { paid: 12, collected: 600000, pending: 3, failed: 1, total: 16 },
    group: groups[0],
  },
  {
    id: "col2",
    group_id: "grp1",
    short_code: "levy1",
    name: "Lab levy",
    description: "Laboratory consumables",
    amount: 2500,
    currency: "NGN",
    is_active: false,
    created_at: "2026-01-07",
    stats: { paid: 4, collected: 10000, pending: 0, failed: 0, total: 4 },
    group: groups[0],
  },
  {
    id: "col3",
    group_id: null,
    short_code: "misc1",
    name: "Ungrouped drive",
    description: "Not part of any group",
    amount: 1000,
    currency: "NGN",
    is_active: true,
    created_at: "2026-01-08",
    stats: { paid: 1, collected: 1000, pending: 0, failed: 0, total: 1 },
    group: null,
  },
];

const payerFields = [
  {
    position: 0,
    display_name: "Email",
    field_id: "email",
    type: "email",
    required: true,
    isSystemField: true,
  },
  {
    position: 1,
    display_name: "Full name",
    field_id: "full_name",
    type: "short_text",
    required: true,
  },
  {
    position: 2,
    display_name: "Matric number",
    field_id: "matric_number",
    type: "short_text",
    required: false,
  },
];

function json(res, status, body, origin) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type, authorization, accept",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Expose-Headers": "set-auth-token",
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || "*";
  const url = new URL(req.url, "http://localhost:3001");
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "content-type, authorization, accept",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    });
    res.end();
    return;
  }

  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    let body = null;
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = raw;
      }
    }

    if (path === "/health") return json(res, 200, { status: "ok" }, origin);

    if (path === "/api/auth/get-session")
      return json(
        res,
        200,
        {
          session: {
            id: "sess1",
            userId: "user1",
            expiresAt: "2030-01-01T00:00:00.000Z",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          user: {
            id: "user1",
            name: "Ada Obi",
            email: "ada@example.com",
            emailVerified: true,
            image: null,
            role: "user",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        },
        origin,
      );

    if (path === "/api/merchants/me")
      return json(
        res,
        200,
        {
          merchant: {
            id: "mer1",
            user_id: "user1",
            display_name: "Kings Workspace",
            status: "approved",
            created_at: "2026-01-01",
          },
        },
        origin,
      );

    if (path === "/api/collection-groups")
      return json(res, 200, { groups }, origin);

    if (path === "/api/collections")
      return json(res, 200, { collections }, origin);

    const byCode = /^\/api\/collections\/by-code\/(.+)$/.exec(path);
    if (byCode) {
      const code = decodeURIComponent(byCode[1]);
      const found = collections.find((c) => c.short_code === code);
      if (!found)
        return json(
          res,
          404,
          { error: { code: "not_found", message: "Collection not found" } },
          origin,
        );
      const { stats: _stats, group, ...collection } = found;
      return json(res, 200, { collection, fields: payerFields, group }, origin);
    }

    if (path === "/api/payments/init" && req.method === "POST") {
      console.log(`POST /api/payments/init BODY=${JSON.stringify(body)}`);
      return json(
        res,
        201,
        {
          transaction: {
            id: "tx1",
            reference: "txnSTUB123",
            status: "pending",
            amount: body?.field_values ? 50000 : 0,
            currency: "NGN",
            created_at: new Date().toISOString(),
          },
          payment_account: {
            id: "pa1",
            gateway: "paystack",
            account_number: "0123456789",
            account_name: "KINGS COLLEGE LAGOS",
            bank_code: "058",
            bank_name: "Guaranty Trust",
            currency: "NGN",
          },
          breakdown: {
            amount: 50000,
            platform_fee: 75,
            gateway_fee: 100,
            total_charged: 50175,
            currency: "NGN",
          },
        },
        origin,
      );
    }

    console.log(`MISS ${req.method} ${path}`);
    return json(
      res,
      404,
      { error: { code: "not_found", message: `No stub for ${path}` } },
      origin,
    );
  });
});

server.listen(3001, () => console.log("stub api listening on 3001"));
