'use client';

import "reflect-metadata";
import { Product, ProductType } from "@/app/product/Product";
import React, { useState } from "react";
import Link from "next/link";
import { container } from "tsyringe";
import { CartProbe } from "@/app/cart3/probe/CartProbe";
import { requestRemove } from "@/app/utils/requestRemove";

export default function CartPage3() {
  const probe = container.resolve(CartProbe);

  // 장바구니 상태
  const [cart, setCart] = useState<Product[]>([
    Product.of('1', 'Product 1', 10, ProductType.BOOK),
    Product.of('2', 'Product 2', 20, ProductType.FOOD),
  ]);

  const removeFromCart = async (product: Product) => {
    probe.applyingRemove(product);

    try {
      await requestRemove(product.id);
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
