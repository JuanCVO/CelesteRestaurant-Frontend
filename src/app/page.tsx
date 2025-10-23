"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditProductDialog } from "@/components/EditProductDialog";

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

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [products, setProducts] = useState<Product[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Dialogs
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [showCierreDialog, setShowCierreDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
const [isClosingDay, setIsClosingDay] = useState(false);


  // Pedido nuevo o existente
  const [newPedido, setNewPedido] = useState<{ table: string; items: OrderItem[] }>({
    table: "",
    items: [],
  });
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<number | "">("");
  const [quantity, setQuantity] = useState<string>("");
  const [tipAmount, setTipAmount] = useState<string>("");

  interface CierreData {
  fecha: string;
  pedidosCerrados: number;
  totalPropinas: number;
  totalVentas: number;
  }

const [cierreData, setCierreData] = useState<CierreData | null>(null);
  // 📦 Obtener productos y pedidos
  const fetchProducts = async () => {
    const res = await fetch(`${API_URL}/products`);
    const data = await res.json();
    setProducts(data);
  };

  const fetchPedidos = async () => {
    const res = await fetch(`${API_URL}/orders`);
    const data = await res.json();
    setPedidos(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchPedidos();
  }, []);

  // ✏️ Editar producto
  const updateProduct = async (updated: Product) => {
    await fetch(`${API_URL}/products/${updated.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    fetchProducts();
  };

  const [cierres, setCierres] = useState<CierreData[]>([]);
  const [showHistorialDialog, setShowHistorialDialog] = useState(false);

  const fetchHistorialCierres = async () => {
    const res = await fetch(`${API_URL}/orders/cierres`);  // <-- Asegúrate que el endpoint sea este
    const data = await res.json();

    if (!res.ok) {
      alert(`❌ Error al obtener historial: ${data.error || "Desconocido"}`);
      return;
    }

    setCierres(data);
    setShowHistorialDialog(true);
  };

  // ➕ Agregar producto a la lista local del modal (nuevo o añadir a existente)
  const addProductToLocalList = () => {
    if (!selectedProduct || !quantity) return;

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const qty = Number(quantity);
    if (qty <= 0) {
      alert("Ingresa una cantidad válida.");
      return;
    }

    if (qty > product.stock) {
      alert(`❌ No hay suficiente stock de ${product.name}. Quedan ${product.stock}`);
      return;
    }

    const existing = newPedido.items.find((i) => i.productId === selectedProduct);
    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > product.stock) {
        alert(`❌ No hay suficiente stock de ${product.name}.`);
        return;
      }
      existing.quantity = newQty;
    } else {
      newPedido.items.push({
        productId: Number(selectedProduct),
        quantity: qty,
        product,
      });
    }

    setNewPedido({ ...newPedido });
    setSelectedProduct("");
    setQuantity("");
  };

  // 💾 Crear pedido nuevo
  const savePedido = async () => {
    if (!newPedido.table || newPedido.items.length === 0) {
      alert("Debes asignar una mesa y agregar productos.");
      return;
    }

    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: newPedido.table,
        items: newPedido.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`❌ Error al crear pedido: ${data.error || "Desconocido"}`);
      return;
    }

    alert("✅ Pedido creado correctamente.");
    setShowNewDialog(false);
    setNewPedido({ table: "", items: [] });
    fetchPedidos();
    fetchProducts();
  };

  // 🧩 Agregar productos a un pedido abierto existente
  const addItemsToPedido = async () => {
    if (!selectedPedidoId || newPedido.items.length === 0) {
      alert("Debes seleccionar un pedido y agregar productos.");
      return;
    }

    const res = await fetch(`${API_URL}/orders/${selectedPedidoId}/add-item`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: newPedido.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`❌ Error al agregar productos: ${data.error || "Desconocido"}`);
      return;
    }

    alert("✅ Productos agregados al pedido.");
    setShowAddDialog(false);
    setNewPedido({ table: "", items: [] });
    setSelectedPedidoId(null);
    fetchPedidos();
    fetchProducts();
  };

  // 💰 Cerrar pedido (con propina)
  const closePedido = async () => {
    if (!selectedPedidoId) return;
    const tip = parseFloat(tipAmount) || 0;

    const res = await fetch(`${API_URL}/orders/${selectedPedidoId}/close`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tip }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`❌ Error al cerrar pedido: ${data.error || "Desconocido"}`);
      return;
    }

    alert(`✅ Pedido #${selectedPedidoId} cerrado con propina de $${tip.toFixed(2)}`);
    setShowTipDialog(false);
    setTipAmount("");
    setSelectedPedidoId(null);
    fetchPedidos();
  };

  // 🗑️ Eliminar pedido
  const deletePedido = async (id: number) => {
    if (!confirm(`¿Seguro que deseas eliminar el pedido #${id}?`)) return;
    const res = await fetch(`${API_URL}/orders/${id}`, { method: "DELETE" });

    const data = await res.json();
    if (!res.ok) {
      alert(`❌ Error al eliminar: ${data.error || "Desconocido"}`);
      return;
    }

    alert(data.message || "Pedido eliminado.");
    fetchPedidos();
    fetchProducts();
  };

  // 📅 Cierre del día (calcula pedidos cerrados del dia )
  const handleConfirmCierre = () => {
  setShowConfirmDialog(true);
};

// 📦 Ejecuta el cierre real (solo si confirma)
const handleCierreDelDia = async () => {
  try {
    setIsClosingDay(true);
    const res = await fetch(`${API_URL}/orders/cierre-dia`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      alert(`⚠️ ${data.error || "Error al generar el cierre."}`);
      return;
    }

    setCierreData(data.cierre);
    setShowConfirmDialog(false);
    setShowCierreDialog(true);
  } catch (error) {
    console.error("❌ Error en el cierre del día:", error);
    alert("❌ No se pudo completar el cierre del día. Inténtalo nuevamente.");
  } finally {
    setIsClosingDay(false);
  }
  };

  const [searchTerm, setSearchTerm] = useState("");

  return (
    <main className="min-h-screen bg-[rgba(10,103,162,1)] p-6">
      <div className="flex flex-col items-center mb-8">
        <img
          src="/celeste-logo.png"
          alt="Celeste Restaurant"
          className="mx-auto mb-4 w-50 h-50 rounded-full object-cover border-4 border-blue-500 shadow-lg"
        />
        <h1 className="text-3xl font-bold mb-8 text-center">Administración</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {/* IZQUIERDA - PRODUCTOS */}
        <Card className="bg-[rgba(241,244,245,1)] shadow-md rounded-2xl">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg font-semibold">Productos registrados</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="text"
                placeholder="🔍 Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                className="hidden sm:inline"
              >
                Limpiar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    <th className="border p-2">Nombre</th>
                    <th className="border p-2">Categoría</th>
                    <th className="border p-2">Precio</th>
                    <th className="border p-2">Stock</th>
                    <th className="border p-2 text-center">Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products
                    .filter((p) =>
                      p.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((p) => (
                    <tr key={p.id} className="hover:bg-gray-200 transition-colors">
                      <td className="border p-2 font-medium text-gray-800">{p.name}</td>
                      <td className="border p-2 text-gray-700">{p.category}</td>
                      <td className="border p-2 text-gray-700">${Number(p.price).toFixed(0)}</td>
                      <td className="border p-2 text-gray-700">
                        {p.stock > 0 ? (
                          p.stock
                        ) : (
                          <span className="text-red-500 font-semibold">⚠️ Agotado</span>
                        )}
                      </td>
                      <td className="border p-2 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProduct(p)}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* DERECHA - PEDIDOS */}
        <Card className="bg-[rgba(241,244,245,1)]">
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
                    <td colSpan={6} className="text-center text-gray-400 p-4">No hay pedidos aún.</td>
                  </tr>
                ) : (
                  pedidos.map((o) => (
                    <tr key={o.id}>
                      <td className="border p-2 font-medium">{o.table}</td>
                      <td className="border p-2">
                        {o.items.map((i, idx) => (<div key={idx}>{i.product?.name} × {i.quantity}</div>))}
                      </td>
                      <td className="border p-2 font-semibold">${Number(o.total).toFixed(0)}</td>
                      <td className="border p-2">{o.isClosed ? "✅ Cerrado" : "🕒 Abierto"}</td>
                      <td className="border p-2">{new Date(o.createdAt).toLocaleTimeString()}</td>
                      <td className="border p-2 text-center space-y-2">
                        {!o.isClosed && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => { setSelectedPedidoId(o.id); setShowAddDialog(true); }}>
                              Agregar Productos
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setSelectedPedidoId(o.id); setShowTipDialog(true); }}>
                              Cerrar Pedido
                            </Button>
                          </>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => deletePedido(o.id)}> Eliminar</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* BOTÓN CIERRE DEL DÍA */}
            <div className="mt-6 flex justify-center">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleConfirmCierre}
              >
                Cierre del Día
              </Button>
              <Button
                variant="outline"
                className="border-blue-600 text-blue-700 hover:bg-blue-100"
                onClick={fetchHistorialCierres}
              >
                Ver Historial de Cierres
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showHistorialDialog} onOpenChange={setShowHistorialDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>📊 Historial de Cierres Diarios</DialogTitle>
          </DialogHeader>

          {cierres.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No hay cierres registrados aún.</p>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border p-2">Fecha</th>
                    <th className="border p-2">Pedidos Cerrados</th>
                    <th className="border p-2">Total Propinas</th>
                    <th className="border p-2">Total Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {cierres.map((cierre, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border p-2 text-center">
                        {new Date(cierre.fecha).toLocaleDateString()}
                      </td>
                      <td className="border p-2 text-center">{cierre.pedidosCerrados}</td>
                      <td className="border p-2 text-right">
                        ${Number(cierre.totalPropinas).toLocaleString()}
                      </td>
                      <td className="border p-2 text-right font-semibold">
                        ${Number(cierre.totalVentas).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <Button onClick={() => setShowHistorialDialog(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* DIALOG CONFIRMACIÓN DE CIERRE */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Confirmar cierre del día?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 mb-4">
            Esta acción registrará el total de ventas y propinas del día. 
            Solo puede hacerse una vez por jornada.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCierreDelDia}
              disabled={isClosingDay}
            >
              {isClosingDay ? "Guardando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG NUEVO PEDIDO */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>🧾 Nuevo Pedido por Mesa</DialogTitle></DialogHeader>
          <PedidoDialogContent
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

      {/* DIALOG AGREGAR A PEDIDO EXISTENTE */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Agregar Productos al Pedido #{selectedPedidoId}</DialogTitle></DialogHeader>
          <PedidoDialogContent
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

      {/* DIALOG PROPINA */}
      <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Agregar Propina</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <Input type="number" placeholder="Monto de la propina" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} />
            <Button onClick={closePedido}>Cerrar Pedido</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG CIERRE DEL DÍA (MUESTRA datos guardados) */}
      <Dialog open={showCierreDialog} onOpenChange={setShowCierreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cierre del Día</DialogTitle></DialogHeader>
          {cierreData ? (
            <div className="space-y-3">
              <p>
                  <strong>Fecha:</strong>{" "}
                  {new Date(cierreData.fecha).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </p>
                <p><strong>Pedidos Cerrados:</strong> {cierreData.pedidosCerrados ?? 0}</p>
                <p><strong>Total Propinas:</strong> ${Number(cierreData.totalPropinas || 0).toFixed(0)}</p>
                <p><strong>Total Ventas:</strong> ${Number(cierreData.totalVentas || 0).toFixed(0)}</p>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setShowCierreDialog(false)}>✅ Cerrar</Button>
            </div>
          ) : (
            <p className="text-gray-500 text-center">Cargando datos del cierre...</p>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG EDITAR PRODUCTO */}
      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={async (updated) => { await updateProduct(updated); fetchProducts(); }}
        />
      )}
    </main>
  );
}

// 🔹 Subcomponente reutilizable para nuevo pedido y agregar productos
interface PedidoDialogContentProps {
  products: Product[];
  selectedProduct: number | "";
  setSelectedProduct: (value: number | "") => void;
  quantity: string;
  setQuantity: (value: string) => void;
  addProductToOrder: () => void;
  pedido: { table?: string; items: OrderItem[] };
  setPedido: React.Dispatch<React.SetStateAction<{ table: string; items: OrderItem[] }>>;
  onSave: () => void;
}

function PedidoDialogContent({
  products,
  selectedProduct,
  setSelectedProduct,
  quantity,
  setQuantity,
  addProductToOrder,
  pedido,
  setPedido,
  onSave,
}: PedidoDialogContentProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Si existe campo 'table' lo mostramos (nuevo pedido) */}
      {pedido.table !== undefined && (
        <Input placeholder="Número o nombre de mesa" value={pedido.table} onChange={(e) => setPedido({ ...pedido, table: e.target.value })} />
      )}

      <div className="flex items-center gap-2">
        <select className="border p-2 rounded w-full" value={selectedProduct} onChange={(e) => setSelectedProduct(Number(e.target.value))}>
          <option value="">Selecciona un producto</option>
          {products.map((p: Product) => (
            <option key={p.id} value={p.id} disabled={p.stock === 0}>
              {p.name} - ${Number(p.price).toFixed(0)} {p.stock === 0 ? "(Sin stock)" : `(${p.stock})`}
            </option>
          ))}
        </select>

        <Input type="number" placeholder="Cantidad" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-24" />

        {/* BOTÓN AGREGAR (visible en modal) */}
        <Button onClick={addProductToOrder}>Agregar</Button>
      </div>

      {pedido.items.length > 0 && (
        <div className="border p-3 rounded bg-gray-50">
          <h3 className="font-medium mb-2">🛒 Productos:</h3>
          {pedido.items.map((i: OrderItem, idx: number) => (
            <div key={idx} className="flex justify-between">
              <span>{i.product?.name} × {i.quantity}</span>
              <span>${((i.product?.price || 0) * i.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}

      <Button onClick={onSave} className="mt-4">Guardar</Button>
    </div>
  );
}
