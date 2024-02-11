'use client';

import "reflect-metadata";
import { mixpanel } from "@/app/utils/Mixpanel";
import { Product, ProductType } from "@/app/product/Product";
import Link from "next/link";
import React from "react";
import { hasProduct } from "@/app/utils/HttpClient";
import { useCart } from "@/app/product/CartContext";

interface AddToCartButtonProps {
  product: Product;
}

function AddToCartButton({ product }: Readonly<AddToCartButtonProps>) {
  const { addToCart } = useCart();
  const handleAddToCart = async () => {
    if(await hasProduct(product.id)) {
      mixpanel.track("product_duplicate_added_to_cart", {
        productId: product.id,
      });
      alert(`${product.name}는 이미 담겨진 상품입니다.`);
      return ;
    }

    mixpanel.track("product_added_to_cart", {
      productId: product.id,
      name: product.name,
      price: product.price
    });
    alert(`${product.name} 상품을 담았습니다.`);

    addToCart(product);
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
      <Link href="/cart">장바구니 보기</Link> <br/>
      <Link href="/cart2">(리팩토링1) 장바구니 보기</Link>
      <Link href="/cart3">(리팩토링2) 장바구니 보기</Link>

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
