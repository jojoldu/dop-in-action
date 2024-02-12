'use client';

import "reflect-metadata";
import { Product } from "@/app/product/Product";
import React, { useState } from "react";
import Link from "next/link";
import { container } from "tsyringe";
import { CartProbe } from "@/app/cart3/probe/CartProbe";
import { httpClient } from "@/app/utils/HttpClient";

export default function CartPage3() {
  const probe = container.resolve(CartProbe);

  const [cart, setCart] = useState<Product[]>(httpClient.getProducts);

  const removeFromCart = async (product: Product) => {
    probe.applyingRemove(product);

    try {
      httpClient.removeProduct(product.id);
      setCart(cart.filter(p => p.id !== product.id));
      probe.remove(product);
    } catch (e) {
      probe.removeFailure(product);
    }
  };

  return (
    <div>
      <h1>장바구니</h1>
      <Link href="/">Home 돌아가기</Link>
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
