// lib/auth.ts
export async function loginUser(email: string, password: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text(); // 👈 capturamos texto crudo

  console.log("🔍 RAW RESPONSE FROM BACKEND:", text); // 👈 capturamos texto crudo (para evitar el JSON.parse error)

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("El servidor devolvió una respuesta no válida.");
  }

  if (!res.ok) {
    throw new Error(data.error || "Error inesperado del servidor. Intenta nuevamente.");
  }

  // ✅ Guardamos el token y usuario en localStorage
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}
// ✅ Nueva función para cerrar sesión
export function logoutUser() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Redirección con temporizador para asegurar limpieza
    setTimeout(() => {
      window.location.replace("/login");
    }, 100);
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
}
