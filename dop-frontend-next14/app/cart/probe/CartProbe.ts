import { injectable } from "tsyringe";
import { Logger } from "@/app/utils/Logger";
import { Product } from "@/app/cart/Product";
import { mixpanel } from "@/app/utils/Mixpanel";

@injectable()
export class ExampleService {
  private readonly logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
  }

  public remove(product: Product): void {
    mixpanel.track("Product Removed in Cart", {
      productId: product.id,
      name: product.name,
      price: product.price
    });
  }
}
