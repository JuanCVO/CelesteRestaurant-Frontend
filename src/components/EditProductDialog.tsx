"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  createdAt?: string;
}

interface EditProductDialogProps {
  product: Product;
  onClose: () => void;
  onSave: (updated: Product) => Promise<void> | void;
}

export function EditProductDialog({
  product,
  onClose,
  onSave,
}: EditProductDialogProps) {
  const [form, setForm] = useState({
    name: product.name,
    category: product.category,
    price: product.price.toString(),
    stock: product.stock.toString(),
  });

  const handleSave = async () => {
    const updatedProduct: Product = {
      ...product,
      name: form.name,
      category: form.category,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
    };

    await onSave(updatedProduct);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-4">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nombre"
          />
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Categoría"
          />
          <Input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Precio"
          />
          <Input
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            placeholder="Stock"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
