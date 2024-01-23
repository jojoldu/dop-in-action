import { Product } from "@/app/product/Product";
import AddToCartButton from "@/app/product/components/AddToCartButton";

export default function ProductsPage () {
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
            {product.name} - ${product.price}
            <AddToCartButton product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
};
