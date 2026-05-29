"use client";

import { NotificationCenter } from "@/components/NotificationCenter";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationCenter />
        {children}
      </NotificationProvider>
    </AuthProvider>
  );
}
