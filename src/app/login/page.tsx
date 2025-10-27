"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "MESERO") {
        router.push("/mesero");
      } else {
        setError("Rol de usuario no reconocido.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error inesperado en el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* 🔹 Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 z-0"
        style={{ backgroundImage: "url('/Fondopag1.png')" }}
      />

      {/* 🔹 Capa de color semitransparente para mejorar contraste */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* 🔹 Formulario centrado */}
      <div className="relative z-10 flex items-center justify-center w-full">
        <Card className="w-full max-w-md shadow-xl bg-white/95 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-blue-700">
              Iniciar Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? "Ingresando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
