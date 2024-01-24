'use client';
import React from 'react';
import { Product } from "@/app/cart/Product";
import { mixpanel } from "@/app/utils/mixpanel";

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const handleAddToCart = () => {
    mixpanel.track("Product Added to Cart", {
      productId: product.id,
      name: product.name,
      price: product.price
    });
    alert(`${product.name} 상품을 담았습니다.`);
  };

  return <button onClick={handleAddToCart}>상품 담기</button>;
};

