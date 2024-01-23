import React from 'react';
import { Product } from "@/app/product/Product";
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
  };

  return <button onClick={handleAddToCart}>Add to Cart</button>;
};

