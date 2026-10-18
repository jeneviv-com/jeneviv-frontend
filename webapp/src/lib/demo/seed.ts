/**
 * Demo dataset for the Jeneviv dashboard.
 *
 * Used only when the real API cannot be reached (see ./index.ts). The data is
 * deliberately realistic — Nigerian names, courses, banks and amounts — so
 * every screen can be reviewed with believable content.
 */

export interface DemoField {
  id: string;
  position: number;
  display_name: string;
  field_id: string;
  type:
    | "short_text"
    | "long_text"
    | "number"
    | "email"
    | "phone"
    | "select"
    | "multiselect"
    | "image"
    | "file"
    | "date";
  required: boolean;
  options?: string[];
}

export interface DemoCollection {
  id: string;
  merchant_id: string;
  short_code: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  is_active: boolean;
  target_payers: number;
  fields: DemoField[];
  created_at: string;
  updated_at: string;
}

export interface DemoTransaction {
  id: string;
  reference: string;
  customer_id: string;
  merchant_id: string;
  collection_id: string;
  collection_name: string;
  payer_name: string;
  payer_email: string;
  status: "pending" | "processing" | "success" | "failed" | "cancelled" | "expired";
  amount: number;
  platform_fee: number;
  gateway_fee: number;
  total_charged: number;
  currency: string;
  gateway: string;
  gateway_ref: string;
  field_values: Record<string, unknown>;
  reconciled: boolean;
  paid_at?: string;
  settled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DemoPayout {
  id: string;
  merchant_id: string;
  bank_account_id: string;
  account_number: string;
  account_name: string;
  bank_code: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "success" | "failed";
  gateway: string;
  gateway_ref: string;
  failure_reason?: string;
  initiated_by: "merchant" | "cron";
  created_at: string;
  updated_at: string;
}

export interface DemoBankAccount {
  id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  currency: string;
  is_default: boolean;
  createdAt: string;
}

export interface DemoTemplate {
  id: string;
  merchant_id: string | null;
  name: string;
  description: string;
  is_public: boolean;
  fields: DemoField[];
  created_at: string;
  updated_at: string;
}

export interface DemoRefund {
  id: string;
  transaction_id: string;
  merchant_id: string;
  amount: number;
  reason: string;
  status: "pending" | "processing" | "success" | "failed";
  gateway_ref: string;
  created_at: string;
  updated_at: string;
}

export interface DemoAuditLog {
  id: string;
  actor_uid: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface DemoMerchant {
  id: string;
  userId: string;
  display_name: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  application_note: string;
  settings: {
    payout_mode: "manual" | "auto_daily" | "auto_weekly";
    email_notification_for_transactions: boolean;
    email_notification_period: "immediate" | "hourly" | "6hourly" | "12hourly" | "daily";
    default_bank_account_id?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DemoNotify {
  id: string;
  type: "payment" | "payout" | "system" | "refund";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface DemoDatabase {
  user: DemoUser;
  token: string;
  merchant: DemoMerchant;
  collections: DemoCollection[];
  transactions: DemoTransaction[];
  payouts: DemoPayout[];
  bankAccounts: DemoBankAccount[];
  templates: DemoTemplate[];
  refunds: DemoRefund[];
  auditLogs: DemoAuditLog[];
  notifications: DemoNotify[];
  adminMerchants: DemoMerchant[];
  signedUpUser?: { user: DemoUser; password: string } | null;
}

const STORAGE_KEY = "jeneviv.demo.v2";
const DAY = 86_400_000;

const FIRST_NAMES = [
  "Adaeze", "Emeka", "Fatima", "Ibrahim", "Chidinma", "Tunde", "Zainab",
  "Oluwaseun", "Ngozi", "Musa", "Blessing", "Kelechi", "Aisha", "Damilola",
  "Uche", "Halima", "Segun", "Amaka", "Yusuf", "Temitope", "Rita", "Chidi",
  "Funmi", "Bashir", "Grace", "Peter", "Ifeoma", "Sadiq", "Nneka", "Gbenga",
];

const LAST_NAMES = [
  "Okonkwo", "Nwosu", "Musa", "Kalu", "Adeyemi", "Bello", "Eze", "Obi",
  "Yakubu", "Afolabi", "Chukwu", "Ibrahim", "Okafor", "Balogun", "Etim",
  "Danjuma", "Ogunleye", "Uche", "Sani", "Oyelaran",
];

/** Deterministic PRNG so the demo dataset is stable between reloads. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function isoDaysAgo(days: number, hour = 9, minute = 12) {
  const date = new Date(Date.now() - days * DAY);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function fee(amount: number) {
  const platform = Math.min(Math.round(amount * 0.015), 2000 - 100) + 100;
  return { platform, total: amount + platform };
}

export function seedDatabase(): DemoDatabase {
  const random = makeRandom(20260418);
  const rand = (min: number, max: number) =>
    Math.floor(random() * (max - min + 1)) + min;

  const user: DemoUser = {
    id: "user_demo_001",
    name: "Ifeanyi Adebayo",
    email: "coordinator@jeneviv.test",
    emailVerified: true,
    image: null,
    role: "admin",
    createdAt: isoDaysAgo(120),
    updatedAt: isoDaysAgo(2),
  };

  const bankAccounts: DemoBankAccount[] = [
    {
      id: "bank_acct_001",
      bank_code: "035",
      bank_name: "Wema Bank",
      account_number: "0123456789",
      account_name: "Jeneviv Demo Workspace",
      currency: "NGN",
      is_default: true,
      createdAt: isoDaysAgo(118),
    },
    {
      id: "bank_acct_002",
      bank_code: "058",
      bank_name: "GTBank",
      account_number: "0234567890",
      account_name: "Ifeanyi Adebayo",
      currency: "NGN",
      is_default: false,
      createdAt: isoDaysAgo(64),
    },
  ];

  const merchant: DemoMerchant = {
    id: "merchant_demo_001",
    userId: user.id,
    display_name: "Ifeanyi Adebayo (CSC 311 coordinator)",
    status: "approved",
    application_note: "Collecting handouts and departmental levies for my class.",
    settings: {
      payout_mode: "auto_daily",
      email_notification_for_transactions: true,
      email_notification_period: "immediate",
      default_bank_account_id: bankAccounts[0].id,
    },
    createdAt: isoDaysAgo(118),
    updatedAt: isoDaysAgo(4),
  };

  const collections: DemoCollection[] = [
    {
      id: "col_csc311",
      merchant_id: merchant.id,
      short_code: "CSC311",
      name: "CSC 311 Handout",
      description: "Course handout and past questions for 300 level.",
      amount: 2500,
      currency: "NGN",
      is_active: true,
      target_payers: 200,
      created_at: isoDaysAgo(42),
      updated_at: isoDaysAgo(3),
      fields: [
        { id: "f1", position: 0, display_name: "Full name", field_id: "full_name", type: "short_text", required: true },
        { id: "f2", position: 1, display_name: "Matric number", field_id: "matric_number", type: "short_text", required: true },
        { id: "f3", position: 2, display_name: "Department", field_id: "department", type: "select", required: true, options: ["Computer Science", "Statistics", "Mathematics", "Physics"] },
        { id: "f4", position: 3, display_name: "Email address", field_id: "email", type: "email", required: true },
        { id: "f5", position: 4, display_name: "Phone number", field_id: "phone", type: "phone", required: false },
      ],
    },
    {
      id: "col_pta26",
      merchant_id: merchant.id,
      short_code: "PTA26",
      name: "PTA Termly Levy — Second Term",
      description: "Termly PTA levy for JSS and SSS parents, 2025/2026 session.",
      amount: 15000,
      currency: "NGN",
      is_active: true,
      target_payers: 240,
      created_at: isoDaysAgo(30),
      updated_at: isoDaysAgo(1),
      fields: [
        { id: "f6", position: 0, display_name: "Parent name", field_id: "parent_name", type: "short_text", required: true },
        { id: "f7", position: 1, display_name: "Student name", field_id: "student_name", type: "short_text", required: true },
        { id: "f8", position: 2, display_name: "Class", field_id: "class", type: "select", required: true, options: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] },
        { id: "f9", position: 3, display_name: "Phone number", field_id: "phone", type: "phone", required: true },
      ],
    },
    {
      id: "col_thrift",
      merchant_id: merchant.id,
      short_code: "THRIFT",
      name: "Greenfield Coop Monthly Thrift",
      description: "Monthly member contribution for the Greenfield cooperative.",
      amount: 10000,
      currency: "NGN",
      is_active: true,
      target_payers: 64,
      created_at: isoDaysAgo(24),
      updated_at: isoDaysAgo(2),
      fields: [
        { id: "f10", position: 0, display_name: "Member name", field_id: "member_name", type: "short_text", required: true },
        { id: "f11", position: 1, display_name: "Member ID", field_id: "member_id", type: "short_text", required: true },
        { id: "f12", position: 2, display_name: "Month", field_id: "month", type: "select", required: true, options: ["January", "February", "March", "April", "May", "June"] },
      ],
    },
    {
      id: "col_nacos",
      merchant_id: merchant.id,
      short_code: "NACOS26",
      name: "NACOS Annual Dues",
      description: "Annual chapter dues for returning members.",
      amount: 5000,
      currency: "NGN",
      is_active: true,
      target_payers: 180,
      created_at: isoDaysAgo(16),
      updated_at: isoDaysAgo(6),
      fields: [
        { id: "f13", position: 0, display_name: "Member name", field_id: "member_name", type: "short_text", required: true },
        { id: "f14", position: 1, display_name: "Level", field_id: "level", type: "select", required: true, options: ["100", "200", "300", "400", "500"] },
      ],
    },
    {
      id: "col_dinner",
      merchant_id: merchant.id,
      short_code: "DINNER",
      name: "Departmental Dinner Night",
      description: "Ticket contribution for the end-of-session dinner.",
      amount: 7500,
      currency: "NGN",
      is_active: false,
      target_payers: 150,
      created_at: isoDaysAgo(9),
      updated_at: isoDaysAgo(5),
      fields: [
        { id: "f15", position: 0, display_name: "Attendee name", field_id: "attendee_name", type: "short_text", required: true },
      ],
    },
  ];

  const departments = ["Computer Science", "Statistics", "Mathematics", "Physics"];
  const transactions: DemoTransaction[] = [];
  let counter = 1000;

  collections.forEach((collection, collectionIndex) => {
    const volume =
      collection.id === "col_csc311"
        ? 136
        : collection.id === "col_pta26"
          ? 128
          : collection.id === "col_thrift"
            ? 47
            : collection.id === "col_nacos"
              ? 61
              : 18;

    for (let i = 0; i < volume; i += 1) {
      counter += 1;
      const first = FIRST_NAMES[rand(0, FIRST_NAMES.length - 1)];
      const last = LAST_NAMES[rand(0, LAST_NAMES.length - 1)];
      const payerName = `${first} ${last}`;
      const roll = random();
      const status: DemoTransaction["status"] =
        roll > 0.94 ? "pending" : roll > 0.9 ? "failed" : "success";
      const daysAgo = Math.max(0, Math.round((1 - i / volume) * 28 + rand(0, 4)));
      const createdAt = isoDaysAgo(daysAgo, rand(7, 21), rand(0, 59));
      const { platform, total } = fee(collection.amount);
      const fieldValues: Record<string, unknown> = {};

      collection.fields.forEach((field) => {
        if (field.field_id.includes("email"))
          fieldValues[field.field_id] =
            `${first.toLowerCase()}.${last.toLowerCase()}@student.edu.ng`;
        else if (field.field_id.includes("phone"))
          fieldValues[field.field_id] =
            `080${rand(10000000, 99999999)}`.slice(0, 11);
        else if (field.field_id.includes("matric") || field.field_id.includes("member_id"))
          fieldValues[field.field_id] =
            `20${rand(18, 24)}/${collection.short_code.slice(0, 3)}/${String(rand(1, 400)).padStart(3, "0")}`;
        else if (field.type === "select" && field.options)
          fieldValues[field.field_id] =
            field.options[rand(0, field.options.length - 1)];
        else fieldValues[field.field_id] = collectionIndex === 1 ? payerName : `${first} ${last}`;
      });

      transactions.push({
        id: `txn_${counter}`,
        reference: `JNV-${collection.short_code}-${counter}`,
        customer_id: `cus_${rand(1000, 9999)}`,
        merchant_id: merchant.id,
        collection_id: collection.id,
        collection_name: collection.name,
        payer_name: payerName,
        payer_email: `${first.toLowerCase()}.${last.toLowerCase()}@student.edu.ng`,
        status,
        amount: collection.amount,
        platform_fee: platform,
        gateway_fee: Math.round(collection.amount * 0.014),
        total_charged: total,
        currency: collection.currency,
        gateway: "flutterwave",
        gateway_ref: `FLW-${rand(100000, 999999)}`,
        field_values: fieldValues,
        reconciled: status === "success" ? random() > 0.06 : false,
        paid_at: status === "success" ? createdAt : undefined,
        settled_at:
          status === "success" && daysAgo > 2 ? isoDaysAgo(daysAgo - 1) : undefined,
        created_at: createdAt,
        updated_at: createdAt,
      });
    }
  });

  transactions.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const successful = transactions.filter((t) => t.status === "success");
  const totalCollected = successful.reduce((sum, t) => sum + t.amount, 0);
  const totalSettled = successful.reduce((sum, t) => sum + t.amount, 0) * 0.72;

  const payouts: DemoPayout[] = [
    {
      id: "payout_006",
      merchant_id: merchant.id,
      bank_account_id: bankAccounts[0].id,
      account_number: bankAccounts[0].account_number,
      account_name: bankAccounts[0].account_name,
      bank_code: bankAccounts[0].bank_code,
      amount: 96250,
      currency: "NGN",
      status: "pending",
      gateway: "flutterwave",
      gateway_ref: "PAY-DEMO-006",
      initiated_by: "cron",
      created_at: isoDaysAgo(0, 22, 0),
      updated_at: isoDaysAgo(0, 22, 0),
    },
    {
      id: "payout_005",
      merchant_id: merchant.id,
      bank_account_id: bankAccounts[0].id,
      account_number: bankAccounts[0].account_number,
      account_name: bankAccounts[0].account_name,
      bank_code: bankAccounts[0].bank_code,
      amount: 184500,
      currency: "NGN",
      status: "success",
      gateway: "flutterwave",
      gateway_ref: "PAY-DEMO-005",
      initiated_by: "cron",
      created_at: isoDaysAgo(0, 10, 0),
      updated_at: isoDaysAgo(0, 10, 24),
    },
    {
      id: "payout_004",
      merchant_id: merchant.id,
      bank_account_id: bankAccounts[0].id,
      account_number: bankAccounts[0].account_number,
      account_name: bankAccounts[0].account_name,
      bank_code: bankAccounts[0].bank_code,
      amount: 243000,
      currency: "NGN",
      status: "success",
      gateway: "flutterwave",
      gateway_ref: "PAY-DEMO-004",
      initiated_by: "cron",
      created_at: isoDaysAgo(1, 22, 0),
      updated_at: isoDaysAgo(1, 22, 31),
    },
    {
      id: "payout_003",
      merchant_id: merchant.id,
      bank_account_id: bankAccounts[1].id,
      account_number: bankAccounts[1].account_number,
      account_name: bankAccounts[1].account_name,
      bank_code: bankAccounts[1].bank_code,
      amount: 120000,
      currency: "NGN",
      status: "success",
      gateway: "flutterwave",
      gateway_ref: "PAY-DEMO-003",
      initiated_by: "merchant",
      created_at: isoDaysAgo(3, 15, 12),
      updated_at: isoDaysAgo(3, 15, 44),
    },
    {
      id: "payout_002",
      merchant_id: merchant.id,
      bank_account_id: bankAccounts[0].id,
      account_number: bankAccounts[0].account_number,
      account_name: bankAccounts[0].account_name,
      bank_code: bankAccounts[0].bank_code,
      amount: 78000,
      currency: "NGN",
      status: "failed",
      gateway: "flutterwave",
      gateway_ref: "PAY-DEMO-002",
      failure_reason: "Beneficiary account did not match name on file.",
      initiated_by: "cron",
      created_at: isoDaysAgo(5, 22, 0),
      updated_at: isoDaysAgo(5, 22, 40),
    },
    {
      id: "payout_001",
      merchant_id: merchant.id,
      bank_account_id: bankAccounts[0].id,
      account_number: bankAccounts[0].account_number,
      account_name: bankAccounts[0].account_name,
      bank_code: bankAccounts[0].bank_code,
      amount: 156800,
      currency: "NGN",
      status: "success",
      gateway: "flutterwave",
      gateway_ref: "PAY-DEMO-001",
      initiated_by: "cron",
      created_at: isoDaysAgo(6, 10, 0),
      updated_at: isoDaysAgo(6, 10, 38),
    },
  ];

  const templates: DemoTemplate[] = [
    {
      id: "tmpl_school",
      merchant_id: null,
      name: "School fees",
      description: "Termly school fee collection with class and student details.",
      is_public: true,
      created_at: isoDaysAgo(90),
      updated_at: isoDaysAgo(20),
      fields: [
        { id: "tf1", position: 0, display_name: "Student name", field_id: "student_name", type: "short_text", required: true },
        { id: "tf2", position: 1, display_name: "Admission number", field_id: "admission_number", type: "short_text", required: true },
        { id: "tf3", position: 2, display_name: "Class", field_id: "class", type: "select", required: true, options: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] },
        { id: "tf4", position: 3, display_name: "Parent phone", field_id: "parent_phone", type: "phone", required: true },
      ],
    },
    {
      id: "tmpl_university",
      merchant_id: merchant.id,
      name: "University levy",
      description: "Generic departmental levy for university students.",
      is_public: false,
      created_at: isoDaysAgo(60),
      updated_at: isoDaysAgo(8),
      fields: [
        { id: "tf5", position: 0, display_name: "Full name", field_id: "full_name", type: "short_text", required: true },
        { id: "tf6", position: 1, display_name: "Matric number", field_id: "matric_number", type: "short_text", required: true },
        { id: "tf7", position: 2, display_name: "Department", field_id: "department", type: "short_text", required: true },
        { id: "tf8", position: 3, display_name: "Level", field_id: "level", type: "select", required: true, options: ["100", "200", "300", "400", "500"] },
      ],
    },
    {
      id: "tmpl_thrift",
      merchant_id: merchant.id,
      name: "Cooperative thrift",
      description: "Monthly contribution for cooperative members.",
      is_public: false,
      created_at: isoDaysAgo(40),
      updated_at: isoDaysAgo(12),
      fields: [
        { id: "tf9", position: 0, display_name: "Member name", field_id: "member_name", type: "short_text", required: true },
        { id: "tf10", position: 1, display_name: "Member ID", field_id: "member_id", type: "short_text", required: true },
        { id: "tf11", position: 2, display_name: "Contribution month", field_id: "month", type: "select", required: true, options: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] },
      ],
    },
  ];

  const refunded = transactions.filter((t) => t.status === "success").slice(12, 14);

  const refunds: DemoRefund[] = refunded.map((transaction, index) => ({
    id: `refund_00${index + 1}`,
    transaction_id: transaction.id,
    merchant_id: merchant.id,
    amount: transaction.amount,
    reason:
      index === 0
        ? "Paid twice by mistake."
        : "Student withdrew from the course.",
    status: index === 0 ? "success" : "processing",
    gateway_ref: `RF-${transaction.reference}`,
    created_at: isoDaysAgo(6 - index),
    updated_at: isoDaysAgo(5 - index),
  }));

  const adminMerchants: DemoMerchant[] = [
    {
      id: "merchant_002",
      userId: "user_002",
      display_name: "Bright Future PTA",
      status: "pending",
      application_note: "We collect termly levies for 480 students in Ikorodu.",
      settings: {
        payout_mode: "manual",
        email_notification_for_transactions: true,
        email_notification_period: "daily",
      },
      createdAt: isoDaysAgo(3),
      updatedAt: isoDaysAgo(3),
    },
    {
      id: "merchant_003",
      userId: "user_003",
      display_name: "Unity Cooperative Society",
      status: "approved",
      application_note: "Monthly thrift for 210 members.",
      settings: {
        payout_mode: "auto_weekly",
        email_notification_for_transactions: false,
        email_notification_period: "12hourly",
      },
      createdAt: isoDaysAgo(34),
      updatedAt: isoDaysAgo(30),
    },
    {
      id: "merchant_004",
      userId: "user_004",
      display_name: "Alumni Class of 2015",
      status: "suspended",
      application_note: "Reunion and building fund contributions.",
      settings: {
        payout_mode: "manual",
        email_notification_for_transactions: true,
        email_notification_period: "immediate",
      },
      createdAt: isoDaysAgo(70),
      updatedAt: isoDaysAgo(11),
    },
    merchant,
  ];

  const notifications: DemoNotify[] = [
    {
      id: "note_1",
      type: "payment",
      title: "₦2,500 received",
      body: "Adaeze Okonkwo paid into CSC 311 Handout. Matched automatically.",
      read: false,
      created_at: isoDaysAgo(0, 12, 4),
    },
    {
      id: "note_2",
      type: "payout",
      title: "Evening settlement sent",
      body: "₦184,500 was sent to Wema Bank ••6789.",
      read: false,
      created_at: isoDaysAgo(0, 22, 24),
    },
    {
      id: "note_3",
      type: "refund",
      title: "Refund processing",
      body: "A ₦2,500 refund for JNV-CSC311-1042 is being processed.",
      read: true,
      created_at: isoDaysAgo(1, 9, 40),
    },
    {
      id: "note_4",
      type: "system",
      title: "Bank account verified",
      body: "GTBank ••7890 was verified and linked to your workspace.",
      read: true,
      created_at: isoDaysAgo(64, 14, 10),
    },
  ];

  return {
    user,
    token: "demo-session-token",
    merchant,
    collections,
    transactions,
    payouts,
    bankAccounts,
    templates,
    refunds,
    auditLogs: [
      {
        id: "log_1",
        actor_uid: user.id,
        action: "collection.created",
        entity_type: "collection",
        entity_id: "col_csc311",
        metadata: { name: "CSC 311 Handout" },
        created_at: isoDaysAgo(42),
      },
      {
        id: "log_2",
        actor_uid: user.id,
        action: "payout.initiated",
        entity_type: "payout",
        entity_id: "payout_003",
        metadata: { amount: 120000 },
        created_at: isoDaysAgo(3, 15, 12),
      },
      {
        id: "log_3",
        actor_uid: user.id,
        action: "refund.requested",
        entity_type: "transaction",
        entity_id: refunded[0]?.id ?? "txn_1001",
        metadata: { amount: refunded[0]?.amount ?? 2500 },
        created_at: isoDaysAgo(6),
      },
      {
        id: "log_4",
        actor_uid: "user_002",
        action: "merchant.applied",
        entity_type: "merchant",
        entity_id: "merchant_002",
        metadata: { display_name: "Bright Future PTA" },
        created_at: isoDaysAgo(3),
      },
    ],
    notifications,
    adminMerchants,
  };
}

export function loadDatabase(): DemoDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoDatabase;
  } catch {
    /* ignore corrupt storage */
  }
  const seeded = seedDatabase();
  saveDatabase(seeded);
  return seeded;
}

export function saveDatabase(database: DemoDatabase) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } catch {
    /* storage full or unavailable */
  }
}

export function clearDatabase() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Aggregates ledger balances. Takes the minimum shape it needs so any
 * transaction/payout list (demo seeded data or live API payloads) works.
 */
export function computeBalances(database: {
  transactions: Array<{ status: string; amount: number }>;
  payouts: Array<{ status: string; amount: number }>;
  refunds: Array<{ status: string; amount: number }>;
}) {
  const successful = database.transactions.filter((t) => t.status === "success");
  const collected = successful.reduce((sum, t) => sum + t.amount, 0);
  const settledOut = database.payouts
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayouts = database.payouts
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((sum, p) => sum + p.amount, 0);
  const refunded = database.refunds
    .filter((r) => r.status !== "failed")
    .reduce((sum, r) => sum + r.amount, 0);

  return {
    collected,
    settledOut,
    pendingPayouts,
    refunded,
    available: Math.max(0, collected - settledOut - pendingPayouts - refunded),
  };
}

export function nextId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString()
    .slice(-4)}`;
}

export function demoFee(amount: number) {
  return fee(amount);
}
