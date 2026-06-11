import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Collections from "@/pages/Collections";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Notifications from "@/pages/Notifications";
import ProtectedLayout from "@/pages/ProtectedLayout";
import Settings from "@/pages/Settings";
import Signup from "@/pages/Signup";
import Templates from "@/pages/Templates";
import Transactions from "@/pages/Transactions";
import { Navigate, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}
