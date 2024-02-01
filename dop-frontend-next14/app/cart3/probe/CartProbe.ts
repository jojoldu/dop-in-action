import { singleton } from "tsyringe";
import { Logger } from "@/app/utils/Logger";
import { Product, ProductType } from "@/app/product/Product";
import { Mixpanel } from "@/app/utils/Mixpanel";
import { GtmAnalytics } from "@/app/utils/GtmAnalytics";

@singleton()
export class CartProbe {
  private readonly logger: Logger;
  private readonly gtmAnalytics: GtmAnalytics;
  private readonly mixpanel: Mixpanel;

  constructor(logger: Logger, gtmAnalytics: GtmAnalytics, mixpanel: Mixpanel) {
    this.logger = logger;
    this.gtmAnalytics = gtmAnalytics;
    this.mixpanel = mixpanel;
  }

  public remove(product: Product): void {
    if(product.type === ProductType.FOOD) {
      this.gtmAnalytics.track("click_remove_cart_food");
    } else if(product.type === ProductType.BOOK) {
      this.gtmAnalytics.track("click_remove_cart_book");
    } else if(product.type === ProductType.CLOTHING) {
      this.gtmAnalytics.track("click_remove_cart_clothing");
    }

    this.mixpanel.track("product_removed_cart", {
      productId: product.id,
      name: product.name,
      price: product.price,
      productType: product.type
    });
  }
}
