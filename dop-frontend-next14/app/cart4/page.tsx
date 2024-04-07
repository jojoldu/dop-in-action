'use client';

import "reflect-metadata";
import { Product } from "@/app/product/Product";
import React, { useState } from "react";
import Link from "next/link";
import { httpClient } from "@/app/utils/HttpClient";
import { CartProbe } from "@/app/cart5/probe/CartProbe";

export default function CartPage() {
  const { applyingRemove, remove, removeFailure } = useCartProbe();
  const [cart, setCart] = useState<Product[]>(httpClient.getProducts);

  const removeFromCart = async (product: Product) => {
    applyingRemove(product);

    try {
      httpClient.removeProduct(product.id);
      setCart(cart.filter(p => p.id !== product.id));
      remove(product);
    } catch (e) {
      removeFailure(product);
    }
  };

  return (
    <div>
      <h1>Cart Page</h1>
      <Link href="/">Home</Link>
      <ul>
        {cart.map(product => (
          <li key={product.id}>
            {product.name} - ${product.price} |
            <button onClick={() => removeFromCart(product)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
