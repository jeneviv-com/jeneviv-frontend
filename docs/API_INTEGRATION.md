# Jeneviv API Integration Guide

Complete guide to integrating and using the Jeneviv backend APIs in the frontend application.

## 📡 API Overview

The frontend communicates with the backend via a centralized API client at `/src/lib/api.ts`. All requests include proper authentication, error handling, and TypeScript types.

## 🔗 Base Configuration

**File:** `/src/lib/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
```

**Environment Setup:**

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001  # Development
NEXT_PUBLIC_API_URL=https://api.jeneviv.com  # Production
```

## 🔐 Authentication

### Session Management

The backend uses **better-auth** with session-based authentication:

1. User logs in → Backend returns `token` + sets `better-auth.session_token` cookie
2. Frontend stores session in cookie (automatically managed by browser)
3. API client includes cookie in all subsequent requests

### Sign Up

```typescript
import { authAPI } from "@/lib/api";

const { token, user } = await authAPI.signUp(
  "John Doe",
  "john@example.com",
  "secure_password_123",
);
// Response includes user profile and auth token
```

**Response:**

```json
{
  "token": "BuSpxoeTcfWt836XLdpZCj3BYp1CD5M7",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2026-05-23T21:36:02.363Z"
  }
}
```

### Sign In

```typescript
const { token, user } = await authAPI.signIn(
  "john@example.com",
  "secure_password_123",
);
```

### Get Session

```typescript
const { session, user } = await authAPI.getSession();
// Call this on app startup to restore user state
```

### Sign Out

```typescript
await authAPI.signOut();
// Clears session on backend, removes cookie
```

## 📦 Collections API

### List Collections

```typescript
import { collectionsAPI } from "@/lib/api";

const { collections } = await collectionsAPI.list();
```

**Response:**

```json
{
  "collections": [
    {
      "id": "col_123",
      "name": "Class Fees",
      "description": "2025/26 session tuition",
      "shortCode": "CF2526",
      "amount": 500000,
      "currency": "NGN",
      "status": "active",
      "createdAt": "2026-05-23T21:36:02.363Z"
    }
  ]
}
```

### Create Collection

```typescript
const { collection } = await collectionsAPI.create({
  name: "Class Fees",
  description: "Tuition collection for 2025/26",
  amount: 500000,
  currency: "NGN",
  template_id: "tmpl_123", // Optional
});
```

**Request Headers:**

```
Cookie: better-auth.session_token=...
Origin: http://localhost:3000
Content-Type: application/json
```

### Get Collection

```typescript
const { collection } = await collectionsAPI.get("col_123");
```

### Get Collection by Short Code

```typescript
// For payers to see collection details
const { collection } = await collectionsAPI.getByCode("CF2526");
```

### Update Collection

```typescript
const { collection } = await collectionsAPI.update("col_123", {
  amount: 600000,
  description: "Updated description",
});
```

### Delete Collection

```typescript
const { success } = await collectionsAPI.delete("col_123");
```

### Set Collection Fields

```typescript
const { collection } = await collectionsAPI.setFields("col_123", [
  {
    position: 0,
    display_name: "Student ID",
    field_id: "student_id",
    type: "short_text",
    required: true,
  },
  {
    position: 1,
    display_name: "Department",
    field_id: "department",
    type: "select",
    required: true,
    options: ["Computer Science", "Engineering", "Medicine"],
  },
]);
```

### Get Collection Transactions

```typescript
const { transactions } = await collectionsAPI.transactions("col_123");
```

## 💳 Transactions API

### Get Transaction

```typescript
import { transactionsAPI } from "@/lib/api";

const { transaction } = await transactionsAPI.get("txn_123");
```

**Response:**

```json
{
  "transaction": {
    "id": "txn_123",
    "reference": "JNV-col_123-001",
    "collectionId": "col_123",
    "amount": 500000,
    "status": "completed",
    "payerName": "Jane Doe",
    "payerEmail": "jane@example.com",
    "fieldValues": {
      "student_id": "CSC/2020/001",
      "department": "Computer Science"
    },
    "createdAt": "2026-05-24T10:30:00.000Z"
  }
}
```

### Reconcile Transactions

```typescript
const { updated } = await transactionsAPI.reconcile(
  ["txn_123", "txn_124"],
  true,
);
```

## 💸 Payouts API

### List Payouts

```typescript
import { payoutsAPI } from "@/lib/api";

const { payouts } = await payoutsAPI.list();
```

### Get Payout

```typescript
const { payout } = await payoutsAPI.get("payout_123");
```

### Initiate Payout

```typescript
const { payout } = await payoutsAPI.initiate(
  "bank_account_123", // Bank account ID
  50000, // Amount
  "NGN", // Currency
);

// Response includes payout ID and gateway reference
```

## 🏪 Merchants API

### Get Merchant Profile

```typescript
import { merchantsAPI } from "@/lib/api";

const { merchant } = await merchantsAPI.getMe();
```

**Response:**

```json
{
  "merchant": {
    "id": "merchant_123",
    "userId": "user_123",
    "displayName": "Acme Collections",
    "status": "approved",
    "createdAt": "2026-05-23T21:36:02.363Z"
  }
}
```

### Apply for Merchant Account

```typescript
const { merchant } = await merchantsAPI.apply(
  "My Organization",
  "We collect school fees",
);
```

### List Bank Accounts

```typescript
const { bank_accounts } = await merchantsAPI.bankAccounts.list();
```

### Add Bank Account

```typescript
const { bank_account } = await merchantsAPI.bankAccounts.add({
  bank_code: "100004", // Zenith Bank
  account_number: "1234567890",
  currency: "NGN",
  is_default: true,
});
```

### Delete Bank Account

```typescript
const { success } = await merchantsAPI.bankAccounts.delete("bank_acct_123");
```

### Update Merchant Settings

```typescript
await merchantsAPI.updateSettings({
  payout_mode: "manual",
  email_notification_for_transactions: true,
  email_notification_period: "immediate",
});
```

## 📋 Templates API

### List Templates

```typescript
import { templatesAPI } from "@/lib/api";

const { templates } = await templatesAPI.list("all");
// scope: "all" | "mine" (default: "all")
```

### Create Template

```typescript
const { template } = await templatesAPI.create(
  "School Fees Template",
  "Standard template for school fee collection",
);
```

### Get Template

```typescript
const { template } = await templatesAPI.get("tmpl_123");
```

### Set Template Fields

```typescript
const { template } = await templatesAPI.setFields("tmpl_123", [
  {
    position: 0,
    display_name: "Student Name",
    field_id: "student_name",
    type: "short_text",
    required: true,
  },
  {
    position: 1,
    display_name: "Class",
    field_id: "class",
    type: "select",
    required: true,
    options: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"],
  },
]);
```

### Get Template Fields

```typescript
const { fields } = await templatesAPI.getFields("tmpl_123");
```

### Update Template

```typescript
const { template } = await templatesAPI.update("tmpl_123", {
  description: "Updated description",
});
```

### Delete Template

```typescript
const { success } = await templatesAPI.delete("tmpl_123");
```

## 💰 Payments API

### Initialize Payment

```typescript
import { paymentsAPI } from "@/lib/api";

const { transaction, payment_account } = await paymentsAPI.init(
  "CF2526", // Collection short code
  {
    student_name: "Jane Doe",
    class: "JSS1",
    parent_phone: "+2348000000000",
  },
);

// Response includes virtual account for payment
```

## 🏛️ Admin APIs

### List Merchants

```typescript
import { adminAPI } from "@/lib/api";

const { merchants } = await adminAPI.listMerchants("pending");
// status: "pending" | "approved" | "rejected" | "suspended"
```

### Approve Merchant

```typescript
const { merchant } = await adminAPI.approveMerchant(
  "merchant_123",
  "KYC documents verified",
);
```

### Reject Merchant

```typescript
const { merchant } = await adminAPI.rejectMerchant(
  "merchant_123",
  "Incomplete documentation",
);
```

### Suspend Merchant

```typescript
const { merchant } = await adminAPI.suspendMerchant(
  "merchant_123",
  "Regulatory violation",
);
```

### Refund Transaction

```typescript
const { refund } = await adminAPI.refundTransaction(
  "txn_123",
  "Customer requested cancellation",
);
```

## 🏦 Banks API

### List Banks

```typescript
import { banksAPI } from "@/lib/api";

const { banks } = await banksAPI.list("NG");
```

**Response:**

```json
{
  "banks": [
    {
      "code": "100004",
      "name": "Zenith Bank",
      "country": "NG"
    }
  ]
}
```

## ❌ Error Handling

### APIError Class

```typescript
import { APIError } from '@/lib/api';

try {
  await collectionsAPI.create({ ... });
} catch (error) {
  if (error instanceof APIError) {
    console.error(`HTTP ${error.status}: ${error.message}`);
    console.error(error.data); // Full error response
  }
}
```

### In Components

```typescript
import { useNotifications } from '@/context/NotificationContext';

export function MyComponent() {
  const { addNotification } = useNotifications();

  const handleCreate = async () => {
    try {
      await collectionsAPI.create({ ... });
      addNotification('success', 'Created', 'Collection created');
    } catch (error) {
      addNotification(
        'error',
        'Failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };
}
```

## 🪝 React Hooks

### useCollections

```typescript
import { useCollections } from '@/hooks/useApi';

export function Collections() {
  const { data, loading, error, execute, refetch } = useCollections();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.map(c => <div key={c.id}>{c.name}</div>)}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### usePayout

```typescript
import { usePayouts, useInitiatePayout } from "@/hooks/useApi";

export function Payouts() {
  const { data: payouts, refetch } = usePayouts();
  const { initiate, loading } = useInitiatePayout();

  const handlePayout = async () => {
    const payout = await initiate("bank_123", 50000, "NGN");
    refetch();
  };
}
```

### useMerchant

```typescript
import { useMerchant, useBankAccounts } from '@/hooks/useApi';

export function Profile() {
  const { data: merchant } = useMerchant();
  const { data: accounts, refetch } = useBankAccounts();

  return <div>{merchant?.displayName}</div>;
}
```

## 🌐 Webhooks

### Flutterwave Charge Webhook

```typescript
// Endpoint: POST /api/webhooks/flutterwave
// Headers: flutterwave-signature (HMAC-SHA256)

{
  "id": "wbk_test_001",
  "type": "charge.completed",
  "timestamp": 1735116884019,
  "data": {
    "id": "chg_test_001",
    "reference": "JNV-col_123-001",
    "amount": 1500.75,
    "currency": "NGN",
    "status": "succeeded"
  }
}
```

## 📊 Data Types

### Collection

```typescript
interface Collection {
  id: string;
  name: string;
  description: string;
  shortCode: string;
  amount: number;
  currency: string;
  status: "active" | "closed" | "paused";
  fields?: CollectionField[];
  createdAt: string;
  updatedAt: string;
}
```

### Transaction

```typescript
interface Transaction {
  id: string;
  reference: string;
  collectionId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  payerName: string;
  payerEmail: string;
  fieldValues: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

### User

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## 🚀 Best Practices

1. **Always use hooks** instead of direct API calls in components
2. **Handle errors** with try-catch and show user feedback
3. **Show loading states** while fetching data
4. **Refetch after mutations** to keep UI in sync
5. **Use TypeScript types** from `@/lib/api` for autocomplete
6. **Cache data with SWR** for repeated requests
7. **Debounce search** to reduce API calls

## 📞 Support

- **API Issues** → Check backend logs
- **Type Errors** → Update `/src/lib/api.ts`
- **Auth Issues** → Check middleware.ts
- **Performance** → Profile with DevTools
