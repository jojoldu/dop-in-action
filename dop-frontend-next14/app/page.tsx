'use client';
import "reflect-metadata";
import { mixpanel } from "@/app/utils/Mixpanel";
import { Product } from "@/app/cart/Product";
import AddToCartButton from "@/app/cart/components/AddToCartButton";

export default function Home() {
  mixpanel.track("Home Page View", { page: "Home" });

  // 상품 목록 예시 데이터
  const products: Product[] = [
    { id: '1', name: 'Product 1', price: 10 },
    { id: '2', name: 'Product 2', price: 20 },
    { id: '3', name: 'Product 3', price: 30 }
  ];

  return (
    <div>
      <h1>상품 목록</h1>
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
