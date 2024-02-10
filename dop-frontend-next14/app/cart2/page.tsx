'use client';

import "reflect-metadata";
import { Product, ProductType } from "@/app/product/Product";
import React, { useState } from "react";
import Link from "next/link";
import { gtmAnalytics } from "@/app/utils/GtmAnalytics";
import mixpanel from "mixpanel-browser";
import { requestRemove } from "@/app/utils/requestRemove";
import { logger } from "@/app/utils/Logger";

// 개발할때마다, 테스트코드를 수행할때마다 메트릭 지표를 보낼 것인가?
// 메트릭이 의도한대로 전송된다는 것은 어떻게 검증할 것인가?
function sendRemoveMetric(product: Product) {
  if (product.type === ProductType.FOOD) {
    gtmAnalytics.track("click_remove_cart_food");
  } else if (product.type === ProductType.BOOK) {
    gtmAnalytics.track("click_remove_cart_book");
  } else if (product.type === ProductType.CLOTHING) {
    gtmAnalytics.track("click_remove_cart_clothing");
  }

  mixpanel.track("product_removed_cart", {
    productId: product.id,
    name: product.name,
    price: product.price,
    productType: product.type
  });
}

export default function CartPage() {

  // 장바구니 상태
  const [cart, setCart] = useState<Product[]>([
    Product.of('1', 'Product 1', 10, ProductType.BOOK),
    Product.of('2', 'Product 2', 20, ProductType.FOOD),
  ]);

  const removeFromCart = async (product: Product) => {
    try {
      await requestRemove(product.id);
      setCart(cart.filter(p => p.id !== product.id));
    } catch (e) {
      logger.error(`카트 상품 제거 실패 productId=${product.id}`);
      mixpanel.track("product_removed_cart_failure", {
        productId: product.id,
      });
    }
    sendRemoveMetric(product);
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
