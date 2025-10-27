"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function useAuth(allowedRoles?: string[]) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      // 🧩 Si no hay usuario guardado, redirige al login
      if (!storedUser) {
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(storedUser);

      // 🧩 Validación básica
      if (!parsedUser || !parsedUser.role) {
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      // 🧩 Si el rol no está permitido
      if (allowedRoles && !allowedRoles.includes(parsedUser.role)) {
        router.push("/unauthorized");
        return;
      }

      // 🧩 Guardamos usuario en estado
      setUser(parsedUser);
    } catch (error) {
      console.error("Error leyendo usuario:", error);
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, []); // ✅ Solo se ejecuta una vez al montar

  return user;
}
