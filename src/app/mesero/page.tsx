"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { logoutUser } from "@/lib/auth";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface OrderItem {
  productId: number;
  quantity: number;
  product?: Product;
}

interface Pedido {
  id: number;
  table: string;
  total: number;
  tip?: number;
  isClosed: boolean;
  createdAt: string;
  items: OrderItem[];
}

export default function MeseroPage() {
  const user = useAuth(["MESERO"]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [products, setProducts] = useState<Product[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | "">("");
  const [quantity, setQuantity] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [newPedido, setNewPedido] = useState<{ table: string; items: OrderItem[] }>({
    table: "",
    items: [],
  });

  // 🔐 Peticiones con token
  const fetchWithToken = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      logoutUser();
      throw new Error("No hay token. Inicia sesión nuevamente.");
    }

    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      alert("⚠️ Sesión expirada o sin permisos. Vuelve a iniciar sesión.");
      logoutUser();
      throw new Error("No autorizado");
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("❌ Respuesta inválida:", text);
      throw new Error("Respuesta no válida del servidor");
    }
  };

  // 📦 Cargar productos y pedidos
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products/public`);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error("Error cargando productos:", err);
    }
  };

  const fetchPedidos = async () => {
    try {
      const data = await fetchWithToken(`${API_URL}/orders`);
      if (Array.isArray(data)) setPedidos(data);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchPedidos();
    }
  }, [user]);

  // ➕ Agregar producto a pedido local
  const addProductToLocalList = () => {
    if (!selectedProduct || !quantity) return;

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const qty = Number(quantity);
    if (qty <= 0 || qty > product.stock)
      return alert(`Cantidad inválida. Stock disponible: ${product.stock}`);

    const existing = newPedido.items.find((i) => i.productId === selectedProduct);
    if (existing) {
      existing.quantity += qty;
    } else {
      newPedido.items.push({ productId: product.id, quantity: qty, product });
    }

    setNewPedido({ ...newPedido });
    setSelectedProduct("");
    setQuantity("");
  };

  // 💾 Crear pedido
  const savePedido = async () => {
    if (!newPedido.table || newPedido.items.length === 0)
      return alert("Debes asignar una mesa y agregar productos.");

    try {
      await fetchWithToken(`${API_URL}/orders`, {
        method: "POST",
        body: JSON.stringify({
          table: newPedido.table,
          items: newPedido.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      alert("✅ Pedido creado correctamente.");
      setShowNewDialog(false);
      setNewPedido({ table: "", items: [] });
      fetchPedidos();
      fetchProducts();
    } catch {
      alert("❌ Error al crear pedido.");
    }
  };

  // 🧩 Agregar productos a un pedido existente
  const addItemsToPedido = async () => {
    if (!selectedPedidoId || newPedido.items.length === 0)
      return alert("Selecciona un pedido y agrega productos.");

    try {
      await fetchWithToken(`${API_URL}/orders/${selectedPedidoId}/add-item`, {
        method: "PATCH",
        body: JSON.stringify({
          items: newPedido.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });

      alert("✅ Productos agregados.");
      setShowAddDialog(false);
      setNewPedido({ table: "", items: [] });
      fetchPedidos();
      fetchProducts();
    } catch {
      alert("❌ Error al agregar productos.");
    }
  };

  // 💰 Cerrar pedido
  const closePedido = async () => {
    if (!selectedPedidoId) return;
    const tip = parseFloat(tipAmount) || 0;

    try {
      await fetchWithToken(`${API_URL}/orders/${selectedPedidoId}/close`, {
        method: "PATCH",
        body: JSON.stringify({ tip }),
      });
      alert(`✅ Pedido #${selectedPedidoId} cerrado.`);
      setShowTipDialog(false);
      setTipAmount("");
      fetchPedidos();
    } catch {
      alert("❌ Error al cerrar pedido.");
    }
  };

  if (!user)
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-lg">Verificando sesión...</p>
      </main>
    );

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: "url('/Fondopag1.png')" }}
      ></div>
      
      <div className="relative z-10 p-6">
        <div className="flex flex-col items-center mb-6 md:mb-10">
          <img
            src="/celeste-logo.png"
            alt="Celeste Restaurant"
            className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full object-cover border-4 border-blue-500 shadow-lg mb-3 sm:mb-5"
          />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-white drop-shadow">
            Bienvenido {user.name} 👋
          </h1>
        </div>
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <span className="text-white font-semibold drop-shadow">
          {user?.name} ({user?.role})
        </span>
        <Button variant="destructive" onClick={logoutUser}>
          Cerrar sesión
        </Button>
      </div>
        <Card className="bg-[rgba(241,244,245,1)] shadow-md rounded-2xl max-w-5xl mx-auto">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Pedidos del Día</CardTitle>
            <Button onClick={() => setShowNewDialog(true)}>Nuevo Pedido</Button>
          </CardHeader>

          <CardContent>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Mesa</th>
                  <th className="border p-2">Productos</th>
                  <th className="border p-2">Total</th>
                  <th className="border p-2">Estado</th>
                  <th className="border p-2">Hora</th>
                  <th className="border p-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-gray-400 p-4"
                    >
                      No hay pedidos aún.
                    </td>
                  </tr>
                ) : (
                  pedidos.map((o) => (
                    <tr key={o.id}>
                      <td className="border p-2 font-medium">{o.table}</td>
                      <td className="border p-2">
                        {o.items.map((i, idx) => (
                          <div key={idx}>
                            {i.product?.name} × {i.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="border p-2 font-semibold">
                        ${Number(o.total).toFixed(0)}
                      </td>
                      <td className="border p-2">
                        {o.isClosed ? "✅ Cerrado" : "🕒 Abierto"}
                      </td>
                      <td className="border p-2">
                        {new Date(o.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="border p-2 text-center space-y-2">
                        {!o.isClosed && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPedidoId(o.id);
                                setShowAddDialog(true);
                              }}
                            >
                              Agregar Productos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPedidoId(o.id);
                                setShowTipDialog(true);
                              }}
                            >
                              Cerrar Pedido
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* DIALOG NUEVO PEDIDO */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>🧾 Nuevo Pedido</DialogTitle>
            </DialogHeader>
            <PedidoDialog
              products={products}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              quantity={quantity}
              setQuantity={setQuantity}
              addProductToOrder={addProductToLocalList}
              pedido={newPedido}
              setPedido={setNewPedido}
              onSave={savePedido}
            />
          </DialogContent>
        </Dialog>

        {/* DIALOG AGREGAR PRODUCTOS */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Agregar Productos al Pedido #{selectedPedidoId}
              </DialogTitle>
            </DialogHeader>
            <PedidoDialog
              products={products}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              quantity={quantity}
              setQuantity={setQuantity}
              addProductToOrder={addProductToLocalList}
              pedido={newPedido}
              setPedido={setNewPedido}
              onSave={addItemsToPedido}
            />
          </DialogContent>
        </Dialog>

        {/* DIALOG CERRAR PEDIDO */}
        <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Agregar Propina y Cerrar Pedido</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                type="number"
                placeholder="Monto de propina (opcional)"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
              />
              <Button onClick={closePedido}>Cerrar Pedido</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}

// 🔹 Subcomponente para los modales
interface PedidoDialogProps {
  products: Product[];
  selectedProduct: number | "";
  setSelectedProduct: (value: number | "") => void;
  quantity: string;
  setQuantity: (value: string) => void;
  addProductToOrder: () => void;
  pedido: { table?: string; items: OrderItem[] };
  setPedido: React.Dispatch<
    React.SetStateAction<{ table: string; items: OrderItem[] }>
  >;
  onSave: () => void;
}

function PedidoDialog({
  products,
  selectedProduct,
  setSelectedProduct,
  quantity,
  setQuantity,
  addProductToOrder,
  pedido,
  setPedido,
  onSave,
}: PedidoDialogProps) {
  return (
    <div className="flex flex-col gap-3">
      {pedido.table !== undefined && (
        <Input
          placeholder="Número o nombre de mesa"
          value={pedido.table}
          onChange={(e) =>
            setPedido({ ...pedido, table: e.target.value })
          }
        />
      )}
      <div className="flex items-center gap-2">
        <select
          className="border p-2 rounded w-full"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(Number(e.target.value))}
        >
          <option value="">Selecciona un producto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id} disabled={p.stock === 0}>
              {p.name} - ${Number(p.price).toFixed(0)}{" "}
              {p.stock === 0 ? "(Sin stock)" : `(${p.stock})`}
            </option>
          ))}
        </select>
        <Input
          type="number"
          placeholder="Cantidad"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-24"
        />
        <Button onClick={addProductToOrder}>Agregar</Button>
      </div>

      {pedido.items.length > 0 && (
        <div className="border p-3 rounded bg-gray-50">
          <h3 className="font-medium mb-2">🛒 Productos:</h3>
          {pedido.items.map((i, idx) => (
            <div key={idx} className="flex justify-between">
              <span>
                {i.product?.name} × {i.quantity}
              </span>
              <span>
                ${(Number(i.product?.price || 0) * i.quantity).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}
      <Button onClick={onSave} className="mt-4">
        Guardar
      </Button>
    </div>
  );
}
