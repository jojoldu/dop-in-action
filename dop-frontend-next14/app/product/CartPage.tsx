import { Product } from "@/app/product/Product";
import { useState } from "react";
import { mixpanel } from "@/app/utils/mixpanel";

export default function CartPage() {
  // 장바구니 상태
  const [cart, setCart] = useState<Product[]>([
    { id: '1', name: 'Product 1', price: 10 },
    { id: '2', name: 'Product 2', price: 20 }
  ]);

  const removeFromCart = (product: Product) => {
    setCart(cart.filter(p => p.id !== product.id));
    mixpanel.track("Product Removed in Cart", {
      productId: product.id,
      name: product.name,
      price: product.price
    });
  };

  return (
    <div>
      <h1>장바구니</h1>
      <ul>
        {cart.map(product => (
          <li key={product.id}>
            {product.name} - ${product.price}
            <button onClick={() => removeFromCart(product)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
