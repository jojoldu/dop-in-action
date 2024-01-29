'use client';
import "reflect-metadata";

import { mixpanel } from "@/app/utils/Mixpanel";
import { Product, ProductType } from "@/app/cart/Product";
import Link from "next/link";
import React from "react";

interface AddToCartButtonProps {
  product: Product;
}

function AddToCartButton({ product }: Readonly<AddToCartButtonProps>) {
  const handleAddToCart = () => {
    mixpanel.track("product_added_to_cart", {
      productId: product.id,
      name: product.name,
      price: product.price
    });
    alert(`${product.name} 상품을 담았습니다.`);
  };

  return <button onClick={handleAddToCart}>상품 담기</button>;
}

export default function Home() {
  mixpanel.track("home_page_view", { page: "Home" });

  // 상품 목록 예시 데이터
  const products: Product[] = [
    Product.of('1', 'Product 1', 10, ProductType.BOOK),
    Product.of('2', 'Product 2', 20, ProductType.FOOD),
    Product.of('3', 'Product 3', 30, ProductType.FOOD),
    Product.of('4', 'Product 4', 40, ProductType.CLOTHING),
  ];

  return (
    <div>
      <h1>상품 목록</h1>
      <Link href="/cart">장바구니 보기</Link>

      <ul>
        {products.map(product => (
          <li key={product.id}>
            상품명: {product.name} | 가격: ${product.price} |
            <AddToCartButton product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}
