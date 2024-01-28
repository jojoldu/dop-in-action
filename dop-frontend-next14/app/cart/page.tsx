'use client';

import { Product, ProductType } from "@/app/cart/Product";
import React, { useState } from "react";
import { mixpanel } from "@/app/utils/Mixpanel";
import { gtmAnalytics } from "@/app/utils/GtmAnalytics";
import Link from "next/link";

export default function CartPage() {
  // 장바구니 상태
  const [cart, setCart] = useState<Product[]>([
    Product.of('1', 'Product 1', 10, ProductType.BOOK),
    Product.of('2', 'Product 2', 20, ProductType.FOOD),
  ]);

  const removeFromCart = (product: Product) => {
    setCart(cart.filter(p => p.id !== product.id));

    if(product.type === ProductType.FOOD) {
      gtmAnalytics.track("click_remove_cart_food");
    } else if(product.type === ProductType.BOOK) {
      gtmAnalytics.track("click_remove_cart_book");
    } else if(product.type === ProductType.CLOTHING) {
      gtmAnalytics.track("click_remove_cart_clothing");
    }


    mixpanel.track("product_removed_cart", {
      productId: product.id,
      name: product.name,
      price: product.price,
      productType: product.type
    });
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
