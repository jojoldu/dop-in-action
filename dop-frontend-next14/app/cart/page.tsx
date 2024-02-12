'use client';

import "reflect-metadata";
import { Product, ProductType } from "@/app/product/Product";
import React, { useState } from "react";
import Link from "next/link";
import { gtmAnalytics } from "@/app/utils/GtmAnalytics";
import mixpanel from "mixpanel-browser";
import { logger } from "@/app/utils/Logger";
import { httpClient } from "@/app/utils/HttpClient";

export default function CartPage() {
  const [cart, setCart] = useState<Product[]>(httpClient.getProducts);

  const removeFromCart = async (product: Product) => {
    mixpanel.track("product_apply_remove_cart", {
      productId: product.id,
    });

    try {
      httpClient.removeProduct(product.id);
      setCart(cart.filter(p => p.id !== product.id));

      if(product.type === ProductType.FOOD) {
        gtmAnalytics.track("click_remove_cart_food");
      }

      mixpanel.track("product_removed_cart", {
        productId: product.id,
        name: product.name,
        price: product.price,
        productType: product.type
      });
    } catch (e) {
      logger.error(`카트 상품 제거 실패 productId=${product.id}`);
      mixpanel.track("product_removed_cart_failure", {
        productId: product.id,
      });
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
