import { Product, ProductType } from "@/app/product/Product";


export class HttpClient {
  private myCart: Map<string, Product> = [
    Product.of("1", "Product 1", 10, ProductType.BOOK),
    Product.of("2", "Product 2", 20, ProductType.FOOD),
    Product.of("3", "Product 3", 30, ProductType.FOOD),
    Product.of("4", "Product 4", 40, ProductType.CLOTHING)
  ].reduce((acc, item) => acc.set(item.id, item), new Map<string, Product>());

  getProducts() {
    return Array.from(this.myCart.values());
  }

  hasProduct(productId: string) {
    return this.myCart.has(productId);
  }

  removeProduct(productId: string) {
    return this.myCart.delete(productId);
  }

  addProduct(product: Product) {
    this.myCart.set(product.id, product);
  }
}

export const httpClient = new HttpClient();

