import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import AppShell from "@/components/AppShell";
import Admin from "@/pages/Admin";
import ApproveWithdrawal from "@/pages/ApproveWithdrawal";
import CollectionDetail from "@/pages/CollectionDetail";
import Collections from "@/pages/Collections";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Notifications from "@/pages/Notifications";
import Payers from "@/pages/Payers";
import PaymentLinks from "@/pages/PaymentLinks";
import Payouts from "@/pages/Payouts";
import PublicPay from "@/pages/PublicPay";
import Refunds from "@/pages/Refunds";
import Settings from "@/pages/Settings";
import Signup from "@/pages/Signup";
import Templates from "@/pages/Templates";
import Transactions from "@/pages/Transactions";
import VerifyReceipt from "@/pages/VerifyReceipt";
import RequireAuth from "@/components/RequireAuth";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public pages — no account needed */}
          <Route path="/pay/:code" element={<PublicPay />} />
          <Route path="/verify/:reference" element={<VerifyReceipt />} />
          <Route path="/approve/:token" element={<ApproveWithdrawal />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:id" element={<CollectionDetail />} />
              <Route path="/payment-links" element={<PaymentLinks />} />
              <Route path="/payers" element={<Payers />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/payouts" element={<Payouts />} />
              <Route path="/refunds" element={<Refunds />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
