'use client';

import "reflect-metadata";
import { Product, ProductType } from "@/app/product/Product";
import React, { useState } from "react";
import Link from "next/link";
import { gtmAnalytics } from "@/app/utils/GtmAnalytics";
import mixpanel from "mixpanel-browser";
import { logger } from "@/app/utils/Logger";
import { httpClient } from "@/app/utils/HttpClient";

function applyingRemove(product: Product) {
  mixpanel.track("product_apply_remove_cart", {
    productId: product.id
  });
}

function sendRemoveMetric(product: Product) {
  if (product.type === ProductType.FOOD) {
    gtmAnalytics.track("click_remove_cart_food");
  }

  mixpanel.track("product_removed_cart", {
    productId: product.id,
    name: product.name,
    price: product.price,
    productType: product.type
  });
}

function sendRemoveFailure(product: Product) {
  logger.error(`Remove Cart Exception: productId=${product.id}`);
  mixpanel.track("product_removed_cart_failure", {
    productId: product.id
  });
}

export default function CartPage() {
  const [cart, setCart] = useState<Product[]>(httpClient.getProducts);

  const removeFromCart = async (product: Product) => {
    applyingRemove(product);
    try {
      httpClient.removeProduct(product.id);
      setCart(cart.filter(p => p.id !== product.id));
      sendRemoveMetric(product);
    } catch (e) {
      sendRemoveFailure(product);
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
