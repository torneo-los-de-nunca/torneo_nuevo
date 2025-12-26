import { createContext, useContext, useEffect, useState } from "react";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  // Persistir admin (opcional pero clave)
  useEffect(() => {
    const saved = localStorage.getItem("ldn_admin");
    if (saved === "true") setIsAdmin(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("ldn_admin", isAdmin ? "true" : "false");
  }, [isAdmin]);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        login: () => setIsAdmin(true),
        logout: () => setIsAdmin(false),
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
