import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import AppShell from "@/components/AppShell";
import AcceptInvite from "@/pages/AcceptInvite";
import Admin from "@/pages/Admin";
import CollectionDetail from "@/pages/CollectionDetail";
import Collections from "@/pages/Collections";
import Groups from "@/pages/Groups";
import GroupDetail from "@/pages/GroupDetail";
import Dashboard from "@/pages/Dashboard";
import DashboardPreviewPage from "@/pages/DashboardPreview";
import ForgotPassword from "@/pages/ForgotPassword";
import Login from "@/pages/Login";
import Notifications from "@/pages/Notifications";
import Payers from "@/pages/Payers";
import People from "@/pages/People";
import PaymentLinks from "@/pages/PaymentLinks";
import Payouts from "@/pages/Payouts";
import PublicPay from "@/pages/PublicPay";
import Refunds from "@/pages/Refunds";
import ResetPassword from "@/pages/ResetPassword";
import Settings from "@/pages/Settings";
import Signup from "@/pages/Signup";
import Templates from "@/pages/Templates";
import Transactions from "@/pages/Transactions";
import VerifyReceipt from "@/pages/VerifyReceipt";
import RequireAuth from "@/components/RequireAuth";
import AccessLink from "@/pages/AccessLink";
import DevNotifyCheck from "@/pages/DevNotifyCheck";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public pages — no account needed */}
          <Route path="/pay/:code" element={<PublicPay />} />
          <Route path="/preview/dashboard" element={<DashboardPreviewPage />} />
          {/* A link that carries the account it should sign in as. */}
          <Route path="/access" element={<AccessLink />} />
          {/* Local harness for the notification contract; dev builds only. */}
          {import.meta.env.DEV ? (
            <Route path="/dev/notify-check" element={<DevNotifyCheck />} />
          ) : null}
          <Route path="/verify/:reference" element={<VerifyReceipt />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<RequireAuth />}>
            {/* Invite links land here; the layout comes from the page itself. */}
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:id" element={<GroupDetail />} />
              <Route path="/collections/:id" element={<CollectionDetail />} />
              <Route path="/payment-links" element={<PaymentLinks />} />
              <Route path="/payers" element={<Payers />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/payouts" element={<Payouts />} />
              <Route path="/refunds" element={<Refunds />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/people" element={<People />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
