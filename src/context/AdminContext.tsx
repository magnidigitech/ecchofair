"use client";

import { createContext, useContext, ReactNode, useState } from "react";

interface AdminContextType {
  onDownload: () => void;
  setOnDownload: (fn: () => void) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [onDownload, setOnDownload] = useState<() => void>(() => () => {});

  return (
    <AdminContext.Provider value={{ onDownload, setOnDownload }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
